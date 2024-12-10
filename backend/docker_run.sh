# start docker container
docker run \
  -it \
  -p 8000:8000 \
  --env-file .env.template \
  --name sqlwise \
  sqlwise