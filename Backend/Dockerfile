# Used by Render to run the PHP backend
FROM php:8.3-cli

# PostgreSQL driver for PDO (talks to Supabase)
RUN apt-get update \
    && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# lets PHP's built-in server handle several requests at once
ENV PHP_CLI_SERVER_WORKERS=4

# Render gives us the port in $PORT
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-10000} -t public public/index.php"]
