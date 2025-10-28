# Use the official PHP image
FROM php:8.2-apache

# Copy all project files into the web server directory
COPY . /var/www/html/

# Set working directory
WORKDIR /var/www/html/

# Expose port 80 (Render will automatically map it to $PORT)
EXPOSE 80

# Start PHP's built-in web server pointing to the public folder
CMD ["php", "-S", "0.0.0.0:80", "-t", "public"]
