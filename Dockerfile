FROM php:8.2-apache

# Install required system packages
RUN apt-get update && apt-get install -y \
    libonig-dev \
    libzip-dev \
    default-mysql-client \
    zip \
    unzip \
    && docker-php-ext-install mysqli pdo pdo_mysql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache rewrite
RUN a2enmod rewrite

# Copy project files
COPY . /var/www/html/

WORKDIR /var/www/html

RUN chown -R www-data:www-data /var/www/html

EXPOSE 90

CMD ["apache2-foreground"]

