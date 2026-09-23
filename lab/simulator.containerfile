FROM alpine:3.20

RUN apk add --no-cache python3

WORKDIR /simulator

COPY lab/simulate_users.py ./simulate_users.py

ENV SIM_BASE_URL=http://app:3000
ENV SIM_USERS=5
ENV SIM_DELAY=0.2
ENV SIM_INTERVAL=60

CMD ["sh", "-c", "while true; do python3 simulate_users.py --base-url $SIM_BASE_URL --users $SIM_USERS --delay $SIM_DELAY; echo \"[simulator] next run in ${SIM_INTERVAL}s\"; sleep $SIM_INTERVAL; done"]