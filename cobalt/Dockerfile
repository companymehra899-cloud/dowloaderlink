FROM ghcr.io/imputnet/cobalt:11
USER root
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER node
ENV CORS_WILDCARD=1
ENV API_LISTEN_ADDRESS=0.0.0.0
ENV API_PORT=10000
ENTRYPOINT ["/entrypoint.sh"]
