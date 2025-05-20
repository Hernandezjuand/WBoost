# AI Career Assistant

A comprehensive toolkit for modern job seekers, powered by AI.


## Features

### Resume Analysis
- Multi-model AI analysis (OpenAI, DeepSeek, Gemini)
- ATS compatibility checking
- Skills gap identification
- Experience relevance scoring
- Education alignment evaluation

### Document Generation
- Tailored resume optimization
- Customized cover letters
- Professional follow-up emails
- LinkedIn connection messages

### Application Tracking
- Excel-like tracking grid with inline editing
- 14 comprehensive data fields including:
  - Application dates
  - Sponsorship status
  - Salary information
  - Resume versions
  - Application status with visual indicators
- CSV export for reporting and analysis

### Job Discovery
- Daily updated H1B sponsorship positions
- New graduate opportunities
- Internship listings
- Filtering by company, role, location, and more

### Interview Preparation
- AI-powered interview simulator
- Role-specific question generation
- Performance feedback

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/ai-career-assistant.git
   cd ai-career-assistant
   ```

2. Install dependencies
   ```
   npm install
   ```
   
3. Start the development server
   ```
   npm run dev
   ```

4. Configure your AI provider API keys in the application settings

## Usage

### Resume Upload
Start by uploading your resume in the Resume & Setup tab. The application accepts PDF and DOCX formats.

### Job Analysis
Enter a job description or use the Daily Jobs tab to find opportunities. The application will analyze your resume's compatibility with the position.

### Document Generation
Generate optimized resumes, cover letters, and follow-up emails tailored to specific job descriptions.

### Application Tracking
Track all your applications in the ApplicationTracker, which provides a comprehensive Excel-like interface with the following fields:
- Date Applied
- Said Sponsor?
- Type
- Company
- Role
- Location
- Keywords
- Contact
- Salary
- Link
- Desired (star rating)
- Status
- Resume Upload
- Notes

## Technologies

- **Frontend**: React, TailwindCSS, Framer Motion
- **AI Integration**: OpenAI API, DeepSeek API, Gemini API
- **Data Persistence**: LocalStorage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Created by Juan Diego Hernandez
- Special thanks to Jobright.ai for the job listings data