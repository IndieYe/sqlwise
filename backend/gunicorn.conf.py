# Gunicorn configuration file
import multiprocessing
import os
from wsgi import on_post_fork, on_when_ready

# Get current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Bind IP and port
bind = "0.0.0.0:8000"

# Number of worker processes
workers = multiprocessing.cpu_count() * 2 + 1

# Worker mode
worker_class = "sync"

# Maximum number of concurrent clients
worker_connections = 2000

# Process ID file
pidfile = os.path.join(current_dir, "gunicorn.pid")

# Access and error logs
accesslog = os.path.join(current_dir, "logs/access.log")
errorlog = os.path.join(current_dir, "logs/error.log")

# Log level
loglevel = "info"

# Prevent multiple scheduler instances
preload_app = True

# Keep workers alive for long-running tasks
timeout = 300

# 确保启用钩子函数
post_fork = on_post_fork
when_ready = on_when_ready
