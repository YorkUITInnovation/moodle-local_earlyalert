import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the API hook to avoid network calls during testing
jest.mock('./hooks/useApiData', () => ({
  useApiData: () => ({
    data: {
      students: [],
      alerts: [],
      dashboardStats: {
        totalStudents: 0,
        totalAlerts: 0,
        resolvedAlerts: 0,
        criticalAlerts: 0
      }
    },
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}));

// Mock Azure OpenAI service
jest.mock('./services/azureOpenAIService', () => ({
  __esModule: true,
  default: {
    chatWithAI: jest.fn()
  }
}));

test('renders dashboard title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Early Alerts Dashboard/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders student section', () => {
  render(<App />);
  const studentsText = screen.getByText(/Students/i);
  expect(studentsText).toBeInTheDocument();
});
