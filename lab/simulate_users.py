#!/usr/bin/env python3
"""Simulate user activity against the todos API of the devops app.

Performs realistic operations (create, list, read, update, toggle, delete)
with random delays so it can be used as a traffic generator for monitoring
(Prometheus/Grafana) or load testing.

Usage:
    python3 simulate_users.py --users 10 --max-actions 25
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import time
import urllib.error
import urllib.request

TITLES = [
    "Write release notes",
    "Review pull request",
    "Fix login bug",
    "Update documentation",
    "Refactor auth module",
    "Deploy to staging",
    "Run database migration",
    "Investigate slow query",
    "Add unit tests",
    "Update dependencies",
    "Clean up provisioned resources",
    "Send status update",
]

DESCRIPTIONS = [
    "Scheduled for this week",
    "Blocked by API change",
    "Needs sign-off",
    "In progress",
    "Created during demo",
    "Emergency follow-up",
]

ACTIONS = [
    "list",
    "read",
    "update",
    "toggle",
    "delete",
]


class ApiClient:
    """Tiny HTTP client with no third-party dependencies."""

    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")

    def _request(self, method: str, path: str, payload: dict | None = None):
        url = self.base_url + path
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = urllib.request.Request(url, data=body, method=method)
        if payload is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw = resp.read()
                data = json.loads(raw) if raw else None
                return resp.status, data
        except urllib.error.HTTPError as err:
            raw = err.read()
            try:
                data = json.loads(raw) if raw else None
            except ValueError:
                data = raw.decode("utf-8", "replace") if raw else None
            return err.code, data

    def list_todos(self):
        return self._request("GET", "/todos")

    def get_todo(self, todo_id: str):
        return self._request("GET", f"/todos/{todo_id}")

    def create_todo(self, title: str, description: str):
        return self._request("POST", "/todos", {"title": title, "description": description})

    def update_todo(self, todo_id: str, payload: dict):
        return self._request("PATCH", f"/todos/{todo_id}", payload)

    def delete_todo(self, todo_id: str):
        return self._request("DELETE", f"/todos/{todo_id}")


def pick_existing(todo_id: str | None, created: list, all_todos: list) -> str:
    pool = created or all_todos
    if not pool:
        return todo_id or ""
    return random.choice(pool).get("_id", "")


def simulate_user(
    api: ApiClient,
    user: str,
    min_todos: int,
    max_todos: int,
    min_actions: int,
    max_actions: int,
    delay: float,
) -> dict:
    """Run a single "user session" and return a summary of what happened."""
    stats = {action: 0 for action in ["list", "read", "update", "toggle", "delete", "create"]}
    stats["errors"] = 0
    created: list = []
    all_todos: list = []

    n_todos = random.randint(min_todos, max_todos)
    print(f"[{user}] creating {n_todos} todos")
    for i in range(n_todos):
        title = random.choice(TITLES)
        status, todo = api.create_todo(f"{title} ({user} #{i + 1})", random.choice(DESCRIPTIONS))
        if status in (200, 201):
            created.append(todo)
            stats["create"] += 1
        else:
            stats["errors"] += 1
            print(f"[{user}] create failed: {status} {todo}")
        time.sleep(random.uniform(0, delay))

    _, all_todos = api.list_todos()
    if isinstance(all_todos, list):
        stats["list"] += 1

    n_actions = random.randint(min_actions, max_actions)
    for _ in range(n_actions):
        action = random.choice(ACTIONS)
        todo_id = pick_existing(None, created, all_todos or [])

        if action == "list":
            status, body = api.list_todos()
        elif action == "read":
            if not todo_id:
                continue
            status, body = api.get_todo(todo_id)
        elif action == "update":
            if not todo_id:
                continue
            status, body = api.update_todo(todo_id, {"description": random.choice(DESCRIPTIONS)})
        elif action == "toggle":
            if not todo_id:
                continue
            status, body = api.update_todo(todo_id, {"done": bool(random.getrandbits(1))})
        else:
            if not todo_id:
                continue
            status, body = api.delete_todo(todo_id)
            created = [t for t in created if t.get("_id") != todo_id]
            if isinstance(all_todos, list):
                all_todos = [t for t in all_todos if t.get("_id") != todo_id]

        if status in (200, 201, 204):
            stats[action] += 1
        else:
            stats["errors"] += 1
            print(f"[{user}] {action} failed: {status} {body}")
        time.sleep(random.uniform(0, delay))

    print(f"[{user}] done: {stats}")
    return stats


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://localhost:3000", help="Todos API base URL")
    parser.add_argument("--users", type=int, default=5, help="Number of simulated users (default: 5)")
    parser.add_argument("--min-todos", type=int, default=2, help="Min todos created per user")
    parser.add_argument("--max-todos", type=int, default=8, help="Max todos created per user")
    parser.add_argument("--min-actions", type=int, default=5, help="Min follow-up actions per user")
    parser.add_argument("--max-actions", type=int, default=20, help="Max follow-up actions per user")
    parser.add_argument("--delay", type=float, default=0.5, help="Max random delay (seconds) between requests")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    args = parser.parse_args(argv)

    if args.seed is not None:
        random.seed(args.seed)

    api = ApiClient(args.base_url)

    try:
        status, body = api.list_todos()
    except urllib.error.URLError as err:
        print(f"ERROR: cannot reach {args.base_url}: {err.reason}")
        return 1
    if status != 200:
        print(f"ERROR: {args.base_url}/todos returned status {status}: {body}")
        return 1
    print(f"Connected to {args.base_url} ({len(body)} existing todos)")

    totals = {action: 0 for action in ["list", "read", "update", "toggle", "delete", "create"]}
    totals["errors"] = 0
    start = time.monotonic()

    for u in range(1, args.users + 1):
        stats = simulate_user(
            api,
            f"user-{u}",
            args.min_todos,
            args.max_todos,
            args.min_actions,
            args.max_actions,
            args.delay,
        )
        for key, value in stats.items():
            totals[key] += value

    elapsed = time.monotonic() - start
    total_ops = sum(value for key, value in totals.items() if key != "errors")
    print("\n===== SUMMARY =====")
    for key, value in totals.items():
        print(f"{key:8s}: {value}")
    print(f"\n{total_ops} successful operations in {elapsed:.1f}s "
          f"({total_ops / elapsed:.1f} ops/s)" if elapsed else f"{total_ops} successful operations")
    return 0 if totals["errors"] == 0 else 2


if __name__ == "__main__":
    sys.exit(main())