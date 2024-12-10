## Introduction
Generate precise SQL queries through simple natural language descriptions.

### Support Status
- Interface languages: Chinese, English (more to come)
- Supported databases: Any type
   - For query import scripts, currently supports: SQLite, MySQL, PostgreSQL, SQLServer
- Supported vector databases: Chroma (more to come)
- Supported LLMs: OpenAI (more to come)
- Supported translation (optional): Azure Translator (more to come)

### SQL Generation Process
Similar to a workflow concept, executed step by step:

1. Match business documents
2. Match generation records
3. AI generates potentially relevant fields
4. Match most similar tables and fields based on AI-generated fields
5. AI generates SQL
6. Learning: Learn from results to improve table comments, field comments, and field relationships

## Features
- Progressive improvement, becomes more accurate with use
- Convenient and easy to understand
- Rich and refined functionality

## Usage
### Project Structure
- `backend`: Backend project, using Python and Flask framework
- `frontend`: Frontend project, using React and Tailwind CSS framework

### Dependencies
Backend project depends on the following:

- Database: Stores application data. Default configuration uses SQLite (created in `backend/instance` directory). Can be modified to connect to other databases. Tables are automatically created on first startup
- Vector database: Stores application data. Can start a Chroma docker container and modify configuration to connect to it
- LLM: Uses OpenAI by default. Can modify apikey and other configurations
- Translation: Uses Azure Translator by default. Can modify configuration. If you're using English, this is optional. However, it's highly recommended for other languages as it greatly improves vector database matching accuracy

### Backend Deployment
- Install dependencies: `pip install -r requirements.txt`
- Local development: Enter backend directory, run `python app.py`
- Production deployment: Deploy using gunicorn, refer to `./start.sh`
- Docker deployment:
   - Refer to `./docker_build.sh` to build Docker image
   - Refer to `./docker_run.sh` to run Docker image

### Frontend Deployment
- Local development: Enter frontend directory, run `npm run dev` for development debugging, or `npm run start` to fetch backend API and regenerate API definitions before starting debug
- Production deployment: Use vite to package, run `npm run build`

### Development URLs
In local development mode, frontend URL: `http://localhost:5173`

## Screenshots
### Projects page
![image](https://github.com/user-attachments/assets/f20f4bfd-8e21-435c-a195-088381ca8b97)

### Project page
![image](https://github.com/user-attachments/assets/e56e74ea-bf18-4bc4-bbdb-f36c158a3bbb)
![image](https://github.com/user-attachments/assets/998ffe78-9f67-4c69-8c54-8164a9c2c938)
![image](https://github.com/user-attachments/assets/e77129b5-c315-447d-b552-77e2da86a29d)

### DDL page
![image](https://github.com/user-attachments/assets/9f8c3798-15ce-4f7b-bbb4-fabf07d39fc8)

### Document page
![image](https://github.com/user-attachments/assets/c06320d4-2670-4391-85b0-4db19d291e33)

### Rule page
![image](https://github.com/user-attachments/assets/3d676c9e-8b33-4036-9d66-8975bcc1e0b9)

### Settings page
![image](https://github.com/user-attachments/assets/9793426f-7bce-4a50-9f3b-ca94fcc87247)
