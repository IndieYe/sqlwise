FROM python:3.12

# set working directory
WORKDIR /app

# set environment variable
ENV PYTHONUNBUFFERED=1

# copy dependency files
COPY requirements.txt .

# install python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# copy application code
COPY . .

# expose port
EXPOSE 8000

CMD ["./start.sh"]