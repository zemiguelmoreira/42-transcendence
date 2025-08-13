# 42 Transcendence

A comprehensive multiplayer gaming platform built with modern web technologies, featuring real-time games, user management, chat system, and matchmaking capabilities.

## 🎮 Overview

Transcendence is a full-stack web application that provides a complete gaming experience with multiple classic games (Pong and Snake), user authentication, real-time chat, and intelligent matchmaking. The project demonstrates advanced software architecture principles using microservices, WebSocket communication, and containerized deployment.

## 🏗️ Architecture

The project follows a microservices architecture with the following components:

### Frontend
- **Technology**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Vanilla JavaScript with modular architecture
- **Styling**: Bootstrap 5.3.3 with custom CSS
- **Features**:
  - Responsive design with neon aesthetic
  - Real-time game interfaces
  - User profile management
  - Chat interface
  - Matchmaking UI

### Backend Services

#### User Management API (`UserApi`)
- **Framework**: Django 5.0.6 with Django REST Framework
- **Authentication**: JWT tokens with 2FA support (TOTP)
- **Database**: PostgreSQL
- **Features**:
  - User registration and authentication
  - Profile management
  - Two-factor authentication with QR codes
  - JWT token management
  - CORS handling

#### Game Server (`GameServer`)
- **Framework**: Django with Django Channels
- **WebSocket**: Autobahn/Twisted for real-time communication
- **Games**: Pong and Snake implementations
- **Features**:
  - Real-time multiplayer gaming
  - Game state management
  - WebSocket connections
  - Room-based game sessions

#### Chat Server (`ChatServer`)
- **Framework**: Django with Django Channels
- **Features**:
  - Real-time messaging
  - Private and group chats
  - Message history
  - Online user status

#### Matchmaking Server (`MatchmakingServer`)
- **Framework**: Django
- **Features**:
  - Player queue management
  - Skill-based matching
  - Game session creation
  - Load balancing

### Infrastructure

#### Reverse Proxy (`nginx`)
- **Role**: SSL termination, load balancing, static file serving
- **Port**: 443 (HTTPS)
- **Features**:
  - SSL/TLS configuration
  - Request routing
  - Static file caching

#### Database (`postgres`)
- **Version**: Custom PostgreSQL setup
- **Features**:
  - Persistent data storage
  - User data management
  - Game statistics
  - Chat history

#### Cache (`redis`)
- **Version**: Redis 7
- **Features**:
  - Session storage
  - WebSocket connection management
  - Temporary data caching
  - Pub/Sub for real-time features

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Git
- At least 4GB of available RAM

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 42-transcendence
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and start services**
   ```bash
   cd srcs
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: https://localhost
   - API Documentation: Available through Django admin

### Environment Variables

Create a `.env` file in the `srcs` directory with the following variables:

```env
# Database Configuration
SQL_USER=your_db_user
SQL_PASSWORD=your_db_password
SQL_DATABASE=transcendence_db
SQL_PATH=/path/to/postgres/data

# Django Settings
SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Redis Configuration
REDIS_URL=redis://redis:6379

# JWT Settings
JWT_SECRET_KEY=your_jwt_secret
JWT_ACCESS_TOKEN_LIFETIME=5
JWT_REFRESH_TOKEN_LIFETIME=1
```

## 🎯 Features

### User Management
- **Registration**: Email-based user registration
- **Authentication**: JWT-based authentication
- **2FA**: Time-based One-Time Password (TOTP) with QR codes
- **Profiles**: Customizable user profiles with avatars
- **Friends**: Friend system with requests and management

### Gaming
- **Pong**: Classic Pong game with multiplayer support
- **Snake**: Snake game with competitive features
- **Real-time**: WebSocket-based real-time gameplay
- **Matchmaking**: Intelligent player matching system
- **Statistics**: Game statistics and leaderboards

### Communication
- **Real-time Chat**: WebSocket-based chat system
- **Private Messages**: Direct messaging between users
- **Group Chats**: Multi-user chat rooms
- **Online Status**: Real-time user presence indicators

### Technical Features
- **Microservices**: Independent service architecture
- **Containerization**: Docker-based deployment
- **Load Balancing**: Nginx reverse proxy
- **SSL/TLS**: Secure HTTPS connections
- **Health Checks**: Service monitoring and recovery

## 🛠️ Development

### Project Structure

```
srcs/
├── frontend/           # Frontend application
│   ├── www/           # Static files
│   └── conf/          # Nginx configuration
├── UserApi/           # User management service
├── GameServer/        # Game logic service
├── ChatServer/        # Chat service
├── MatchmakingServer/ # Matchmaking service
├── nginx/             # Reverse proxy
├── postgres/          # Database setup
└── docker-compose.yml # Service orchestration
```

### Adding New Features

1. **New Game**: Add game logic to `GameServer/`
2. **New API Endpoint**: Extend `UserApi/` with new views
3. **Frontend Component**: Add JavaScript modules in `frontend/www/js/`
4. **Database Changes**: Create Django migrations

### Testing

```bash
# Run tests for all services
docker-compose exec user_management python manage.py test
docker-compose exec game_server python manage.py test
docker-compose exec chat_server python manage.py test
docker-compose exec matchmaking_server python manage.py test
```

## 📊 Monitoring

### Health Checks
- All services include health check endpoints
- Automatic service recovery on failure
- Logging and error tracking

### Performance
- Redis caching for improved performance
- Database connection pooling
- Static file optimization

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 443, 8000-8003 are available
2. **Database connection**: Check PostgreSQL container status
3. **WebSocket issues**: Verify Redis connection
4. **SSL errors**: Check nginx configuration

### Logs

```bash
# View service logs
docker-compose logs [service_name]

# Follow logs in real-time
docker-compose logs -f [service_name]
```

## 🔗 Related Projects

- **42-minishell**: Unix shell implementation
- **42-webserv**: HTTP server implementation

---

*This project showcases advanced software architecture, real-time communication, and modern web development practices while providing an engaging gaming experience.*
