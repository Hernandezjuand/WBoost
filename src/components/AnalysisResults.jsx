import React from 'react';

const AnalysisResults = ({ analysis, selectedProviders }) => {
  if (!analysis || !selectedProviders) return null;

  const formatPercentage = (value) => {
    // Convert decimal to percentage if needed
    if (value <= 1) {
      return Math.round(value * 100);
    }
    return Math.round(value);
  };

  const renderAnalysisDetails = (provider, data) => {
    if (!data || data.error) return null;

    return (
      <div className="space-y-6">
        {/* Job Role Analysis - New Section */}
        {data.jobAnalysis && (
          <div className="p-4 rounded-lg border bg-muted/30">
            <h4 className="text-base font-medium text-card-foreground mb-3">Job Requirements Analysis (50%)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-card-foreground mb-2">Core Responsibilities</h5>
                <ul className="list-disc list-inside space-y-1">
                  {data.jobAnalysis.coreResponsibilities?.map((item, index) => (
                    <li key={index} className="text-sm text-muted-foreground">{item}</li>
                  )) || <li className="text-sm text-muted-foreground">Not specified</li>}
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium text-card-foreground mb-2">Required Skills</h5>
                <ul className="list-disc list-inside space-y-1">
                  {data.jobAnalysis.requiredSkills?.map((item, index) => (
                    <li key={index} className="text-sm text-muted-foreground">{item}</li>
                  )) || <li className="text-sm text-muted-foreground">Not specified</li>}
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium text-card-foreground mb-2">Required Experience</h5>
                <p className="text-sm text-muted-foreground">{data.jobAnalysis.requiredExperience || "Not specified"}</p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-card-foreground mb-2">Industry Knowledge</h5>
                <p className="text-sm text-muted-foreground">{data.jobAnalysis.industryKnowledge || "Not specified"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Assessment - Modified to show as 50% */}
        <div className="p-4 rounded-lg border bg-muted/30">
          <h4 className="text-base font-medium text-card-foreground mb-3">Candidate Qualifications Assessment (50%)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-card-foreground">Skills Match</h5>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-sm font-medium">{formatPercentage(data.skillsMatch)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${formatPercentage(data.skillsMatch)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium text-card-foreground">Experience Relevance</h5>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-sm font-medium">{formatPercentage(data.experienceRelevance)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${formatPercentage(data.experienceRelevance)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium text-card-foreground">Education Alignment</h5>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-sm font-medium">{formatPercentage(data.educationAlignment)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${formatPercentage(data.educationAlignment)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium text-card-foreground">Role-Appropriate Level</h5>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-sm font-medium">{formatPercentage(data.roleAppropriateLevel)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${formatPercentage(data.roleAppropriateLevel)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gap Analysis Section */}
        <div className="space-y-4">
          <h4 className="text-base font-medium text-card-foreground mb-2">Gap Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-card-foreground mb-2">Strengths</h5>
              <ul className="list-disc list-inside space-y-1">
                {data.strengths?.map((strength, index) => (
                  <li key={index} className="text-sm text-muted-foreground">{strength}</li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-sm font-medium text-card-foreground mb-2">Areas for Improvement</h5>
              <ul className="list-disc list-inside space-y-1">
                {data.weaknesses?.map((weakness, index) => (
                  <li key={index} className="text-sm text-muted-foreground">{weakness}</li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-sm font-medium text-card-foreground mb-2">Missing Requirements</h5>
              <ul className="list-disc list-inside space-y-1">
                {data.missingRequirements?.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground">{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-sm font-medium text-card-foreground mb-2">Critical Gaps</h5>
              <ul className="list-disc list-inside space-y-1">
                {data.criticalGaps?.map((gap, index) => (
                  <li key={index} className="text-sm text-muted-foreground">{gap}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="text-base font-medium text-card-foreground mb-2">Recommendations</h4>
          <ul className="list-disc list-inside space-y-1">
            {data.recommendations?.map((recommendation, index) => (
              <li key={index} className="text-sm text-muted-foreground">{recommendation}</li>
            ))}
          </ul>
        </div>

        {/* Detailed Feedback */}
        <div>
          <h4 className="text-base font-medium text-card-foreground mb-2">Detailed Feedback</h4>
          <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
            <div>
              <h5 className="text-sm font-medium text-muted-foreground">Overall Assessment</h5>
              <p className="text-sm text-muted-foreground">{data.feedback?.overall}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-muted-foreground">Role Alignment</h5>
              <p className="text-sm text-muted-foreground">{data.feedback?.roleAlignment}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-muted-foreground">Skills Assessment</h5>
              <p className="text-sm text-muted-foreground">{data.feedback?.skills}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-muted-foreground">Experience Assessment</h5>
              <p className="text-sm text-muted-foreground">{data.feedback?.experience}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-muted-foreground">Education Assessment</h5>
              <p className="text-sm text-muted-foreground">{data.feedback?.education}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-muted-foreground">Honest Assessment</h5>
              <p className="text-sm text-muted-foreground">{data.feedback?.honestAssessment}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-card-foreground">
          Resume & Job Role Analysis
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Balanced analysis (50% job requirements, 50% candidate qualifications)
        </p>
      </div>

      <div className="card-body space-y-8">
        {selectedProviders.openai && analysis.openai && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-card-foreground flex items-center">
              <span className="mr-2">OpenAI Analysis</span>
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20">
                Overall Match: {formatPercentage(analysis.openai.overallFit)}%
              </div>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Overall Fit</span>
                <span className="text-sm font-medium">{formatPercentage(analysis.openai.overallFit)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${formatPercentage(analysis.openai.overallFit)}%` }}
                />
              </div>
            </div>
            {renderAnalysisDetails('OpenAI', analysis.openai)}
          </div>
        )}

        {selectedProviders.deepseek && analysis.deepseek && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-card-foreground flex items-center">
              <span className="mr-2">DeepSeek Analysis</span>
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20">
                Overall Match: {formatPercentage(analysis.deepseek.overallFit)}%
              </div>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Overall Fit</span>
                <span className="text-sm font-medium">{formatPercentage(analysis.deepseek.overallFit)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${formatPercentage(analysis.deepseek.overallFit)}%` }}
                />
              </div>
            </div>
            {renderAnalysisDetails('DeepSeek', analysis.deepseek)}
          </div>
        )}

        {selectedProviders.gemini && analysis.gemini && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-card-foreground flex items-center">
              <span className="mr-2">Gemini Analysis</span>
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20">
                Overall Match: {formatPercentage(analysis.gemini.overallFit)}%
              </div>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Overall Fit</span>
                <span className="text-sm font-medium">{formatPercentage(analysis.gemini.overallFit)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${formatPercentage(analysis.gemini.overallFit)}%` }}
                />
              </div>
            </div>
            {renderAnalysisDetails('Gemini', analysis.gemini)}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults; 