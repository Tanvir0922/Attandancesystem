# PHP 8.2 with Apache
FROM php:8.2-apache

# Enable Apache rewrite
RUN a2enmod rewrite

# (Optional) PHP extensions — agar future me chahiye
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Copy project files
COPY . /var/www/html/

# Set working directory
WORKDIR /var/www/html

# Permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]
