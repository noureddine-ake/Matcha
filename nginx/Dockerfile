FROM nginx:1.25-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d /etc/nginx/conf.d

RUN mkdir -p /var/log/nginx /etc/nginx/ssl

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]