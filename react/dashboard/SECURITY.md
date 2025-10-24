# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅                 |
| < 1.0   | ❌                 |

## Reporting a Vulnerability

If you discover a security vulnerability in the Early Alerts Dashboard, please report it responsibly:

1. **DO NOT** create a public issue
2. Email: security@yorku.ca
3. Include detailed steps to reproduce
4. Allow 48 hours for initial response

## Security Best Practices

- All student data is handled according to PIPEDA guidelines
- Database connections use encrypted protocols
- API endpoints implement proper authentication
- Input validation prevents injection attacks
- Regular security audits are performed

## Data Privacy

This application handles sensitive student information. Please ensure:

- Database credentials are never committed to version control
- Environment variables are properly secured
- Access logs are monitored and audited
- Data retention policies are followed
