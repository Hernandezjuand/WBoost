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

## API Keys Setup

To use the full functionality of the AI Career Assistant, you'll need to configure API keys for the AI providers. The application supports multiple AI providers, but you only need to set up one to get started.

### Recommended: Google Gemini (Free Tier Available)
- **Sign up**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to create a free account
- **Get API Key**: Generate an API key (no credit card required)
- **Benefits**: Free tier with generous quota, great for testing and personal use

### Alternative Providers:
1. **OpenAI**
   - Sign up at [OpenAI Platform](https://platform.openai.com/api-keys)
   - Requires credit card for pay-as-you-go pricing

2. **Anthropic Claude**
   - Sign up at [Anthropic Console](https://console.anthropic.com/settings/keys)
   - Requires credit card for pay-as-you-go pricing

3. **DeepSeek**
   - Sign up at [DeepSeek Platform](https://platform.deepseek.com/api_keys)
   - Free trial credits available

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

### Interview Simulator
Practice for interviews with our AI-powered simulator that:
- Generates role-specific questions based on your resume and job description
- Provides detailed feedback on your responses
- Offers a hiring assessment and score

## Deployment

### Deploy to Vercel (Recommended)
1. Fork this repository to your GitHub account
2. Sign up for a [Vercel](https://vercel.com) account
3. Create a new project and import your GitHub repository
4. Deploy with default settings - Vercel will automatically detect the correct configuration

### Other Hosting Options
- Netlify
- GitHub Pages
- Any static site hosting service

## Technologies

- **Frontend**: React, TailwindCSS, Framer Motion
- **AI Integration**: OpenAI API, DeepSeek API, Gemini API, Anthropic API
- **Data Persistence**: LocalStorage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Created by Juan Diego Hernandez
- Special thanks to Jobright.ai for the job listings data