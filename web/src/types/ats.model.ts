export type AtsSeverity = 'critical' | 'warning' | 'success';

export type AtsCategory = 
  | 'layout'
  | 'contact'
  | 'summary'
  | 'experience'
  | 'skills'
  | 'education';

export interface AtsCheckItem {
  id: string;
  category: AtsCategory;
  title: string;
  description: string;
  severity: AtsSeverity;
  passed: boolean;
  scoreImpact: number; // Maximum points allocated to this check
  scoreEarned: number; // Actual points earned
  suggestion?: string;
  autoFixAvailable?: boolean;
}

export interface AtsCategoryScore {
  category: AtsCategory;
  label: string;
  score: number; // 0 to 100%
  earnedPoints: number;
  totalPoints: number;
  passedCount: number;
  totalCount: number;
}

export type AtsRating = 'excellent' | 'good' | 'average' | 'poor';

export interface AtsJobMatchResult {
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface AtsReport {
  overallScore: number; // 0 to 100
  rating: AtsRating;
  ratingLabel: string;
  categories: Record<AtsCategory, AtsCategoryScore>;
  checks: AtsCheckItem[];
  criticalIssuesCount: number;
  warningIssuesCount: number;
  passedCount: number;
  robotPlainText: string;
  actionVerbsDetected: string[];
  metricsDetected: string[];
}
