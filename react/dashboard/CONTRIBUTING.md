# Contributing to Early Alerts Dashboard

Thank you for your interest in contributing to the York University Early Alerts Dashboard!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/[username]/early-alerts-dashboard.git
   cd early-alerts-dashboard
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   pip install -r requirements.txt
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Configure your database settings
   ```

## Code Standards

- **Frontend**: Follow React best practices, use functional components with hooks
- **Backend**: Follow PEP 8 Python style guide
- **Database**: Use meaningful table/column names, add proper indexes
- **Testing**: Maintain 80%+ test coverage
- **Documentation**: Update docs for any API changes

## Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes with appropriate tests
3. Update documentation if needed
4. Ensure CI/CD pipeline passes
5. Request review from maintainers

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Follow university guidelines for student data handling
