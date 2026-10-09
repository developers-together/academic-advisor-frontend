export type UserRole = 'student' | 'advisor' | 'dean' | 'vp' | 'admin';

export type StaffRole = Exclude<UserRole, 'student'>;

export type LanguagePreference = 'en' | 'ar';

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  language_preference: LanguagePreference | null;
  student_id: string | null;
  advisor_id: number | null;
  email_verified_at: string | null;
  pending_admin_at: string | null;
  suspended_at: string | null;
  faculty: string | null;
};

export type UserSummary = { id: number; name: string };

export type StudentSummary = {
  id: number;
  name: string;
  student_id: string | null;
};

export type PlanStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'returned'
  | 'approved'
  | 'expired'
  | 'closed'
  | 'withdrawn'
  | 'discarded';

export type PlannedCourse = {
  course_code: string;
  title: string | null;
  credits: number;
  reason: string | null;
};

export type Plan = {
  id: number;
  status: PlanStatus;
  term_code: string;
  summary: string | null;
  courses: PlannedCourse[];
  total_credit_hours: number;
  warnings: string[];
  submitted_at: string | null;
  decided_at: string | null;
  return_reason: string | null;
};

export type PlanComment = {
  id: number;
  body: string;
  author: UserSummary;
  created_at: string;
};

export type PlanMessageRole = 'user' | 'assistant';

export type PlanConversationMessage = {
  id: number;
  role: PlanMessageRole;
  content: string;
  created_at: string;
};

export type PlanConversation = {
  id: number;
  title: string | null;
  submission_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  messages?: PlanConversationMessage[];
};

export type AcademicRecord = {
  cgpa: number | null;
  curriculum_year_level: number | null;
  history: CourseAttempt[];
  current_enrollments: CurrentEnrollment[];
  prerequisite_map: PrerequisiteMapEntry[];
  last_synced_at: string | null;
};

export type CourseAttempt = {
  course_code: string;
  name: string | null;
  credits: number;
  year: number;
  semester: string;
  level: number;
  grade: string;
};

export type CurrentEnrollment = {
  course_code: string;
  title: string | null;
  group: string;
  section: string;
};

export type PrerequisiteMapState =
  'completed' | 'planned' | 'eligible' | 'locked';

export type PrerequisiteMapEntry = {
  course_code: string;
  title: string | null;
  state: PrerequisiteMapState;
  prerequisites: string[];
};

export type AdvisorProfile = {
  advisor: UserSummary | null;
  availability_window: { rows: AvailabilityWindowRow[] };
  office_location: string | null;
};

export type OfficeLocation = { office_location: string | null };

export type AvailabilityWindowRow = {
  day: string;
  from: string;
  to: string;
};

export type AvailabilityWindow = {
  rows: AvailabilityWindowRow[];
  is_default: boolean;
};

export type AdvisorQueueItem = {
  id: number;
  student: StudentSummary;
  status: PlanStatus;
  term_code: string;
  submitted_at: string | null;
  is_aging: boolean;
};

export type OrgUnit = {
  code: string;
  name_en: string | null;
  name_ar: string | null;
};

export type AdvisorCaseloadStudent = {
  id: number;
  name: string;
  student_id: string | null;
  sis_email: string;
  faculty: OrgUnit | null;
  school: OrgUnit | null;
  department: OrgUnit | null;
  curriculum_year_level: number | null;
  plan_id: number | null;
  plan_state: PlanStatus | null;
  submitted_at: string | null;
  is_aging: boolean;
  has_unmet_meeting: boolean;
  cgpa: number | null;
};

export type VisitRequestStatus = 'proposed' | 'done';

export type MeetingRequestStatus =
  | 'requested'
  | 'awaiting_response'
  | 'confirmed'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'expired'
  | 'conflict';

export type MeetingDirection = 'student_to_advisor' | 'advisor_to_student';

export type MeetingReason =
  | 'plan_review'
  | 'course_selection'
  | 'academic_standing'
  | 'degree_progress'
  | 'other';

export type MeetingSlot = {
  id: number;
  starts_at: string;
  ends_at: string;
  is_conflict?: boolean;
};

export type MeetingRequest = {
  id: number;
  status: MeetingRequestStatus;
  direction: MeetingDirection;
  requester_id: number;
  recipient_id: number;
  student: StudentSummary;
  reason: MeetingReason;
  note: string | null;
  slots: MeetingSlot[];
  selected_slot_id: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancellation_reason: string | null;
};

export type MeetingOpenSlot = {
  starts_at: string;
  ends_at: string;
  is_conflict: boolean;
};

export type VisitRequestSlot = {
  id: number;
  starts_at: string;
  ends_at: string;
};

export type VisitRequest = {
  id: number;
  status: VisitRequestStatus;
  term_code: string;
  initiator_id: number;
  student?: StudentSummary;
  slots: VisitRequestSlot[];
  created_at: string;
};

export type GovernanceLevel =
  'university' | 'faculty' | 'school' | 'department' | 'advisor';

export type GovernanceGroupBy = 'advisor';

export type GovernanceGrouping = 'units' | GovernanceGroupBy;

export type GovernanceFunnel = {
  draft: number;
  submitted: number;
  under_review: number;
  returned: number;
  approved: number;
  expired: number;
  closed: number;
  withdrawn: number;
  discarded: number;
};

export type GovernanceMetrics = {
  students: number;
  caseload: number;
  approved: number;
  completion_rate: number | null;
  completion_is_final: boolean;
  median_decision_hours: number | null;
  aging_count: number;
  funnel: GovernanceFunnel;
};

export type GovernanceDean = { id: number; name: string };

export type GovernanceAdvisorRow = {
  id: number;
  name: string;
  unit_en: string | null;
  unit_ar: string | null;
  caseload: number;
  queue_size: number;
  median_decision_hours: number | null;
  aging_count: number;
  approved: number;
  completion_rate: number | null;
};

export type GovernanceTrendPoint = {
  term_code: string;
  completion_rate: number | null;
  median_decision_hours: number | null;
  aging_count: number;
};

export type GovernanceNode = {
  level: GovernanceLevel;
  code: string | null;
  name_en: string | null;
  name_ar: string | null;
  term_code: string | null;
  metrics: GovernanceMetrics;
  trends: GovernanceTrendPoint[];
  advisors?: GovernanceAdvisorRow[];
  deans?: GovernanceDean[];
  children: GovernanceNode[];
};

export type UniversityRule = {
  id: number;
  faculty: string | null;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  created_at: string;
  updated_at: string;
};

export type UniversityRuleSummary = Pick<
  UniversityRule,
  'id' | 'faculty' | 'title_en' | 'title_ar' | 'body_en' | 'body_ar'
>;

export type UniversityRuleInput = {
  faculty: string | null;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
};

export type NotificationSlug =
  | 'plan_returned'
  | 'plan_approved'
  | 'advisor_changed'
  | 'meeting_requested'
  | 'meeting_proposed'
  | 'meeting_confirmed'
  | 'meeting_declined'
  | 'meeting_cancelled'
  | 'meeting_completed'
  | 'caseload_student_removed'
  | 'caseload_student_added'
  | 'window_opened'
  | 'window_deadline_nearing';

export type DeepLinkScreen = 'plan' | 'student' | 'advisor' | 'visit';

export type DeepLink = {
  screen: DeepLinkScreen;
  plan_id?: number;
  visit_request_id?: number;
  student_id?: number;
  advisor_id?: number;
  term_code?: string;
};

export type AppNotification = {
  id: string;
  slug: NotificationSlug | null;
  title: string | null;
  body: string | null;
  deep_link: DeepLink | string | null;
  read_at: string | null;
  created_at: string;
};

export type TurnFrame =
  | { event: 'token'; turnId: string; seq: number; token: string }
  | {
      event: 'tool.applied';
      turnId: string;
      seq: number;
      tool: string;
      payload: unknown;
    }
  | { event: 'submit.suggested'; turnId: string; seq: number }
  | {
      event: 'submit.result';
      turnId: string;
      seq: number;
      status: 'submitted' | 'blocked';
      plan_id?: number;
      errors?: Record<string, string[]>;
    }
  | {
      event: 'turn.completed';
      turnId: string;
      seq: number;
      title: string | null;
    }
  | {
      event: 'error';
      turnId: string;
      seq: number;
      code: 'turn_failed' | 'turn_timeout';
      retryable: boolean;
      key: string;
      message: string;
    };

export type SubmitArmedFrame = {
  conversation_id: number;
  submission_confirmed_at: string | null;
};

export type ImportSummary = {
  assigned: number;
  unchanged: number;
  scheduled: number;
};

export type AcademicsImportDataset =
  'statistics' | 'active-courses' | 'credit-allowances' | 'curricula';

export type AcademicsImportReport = {
  imported: number;
  skipped: number;
  errors: string[];
};

export type CurrentTerm = {
  code: string;
  kind: string;
  opens: string;
  closes: string;
  starts: string;
};

export type StaffMember = Omit<User, 'role'> & {
  role: StaffRole;
  students_count: number;
};

export type AssignmentMode = 'assigned' | 'scheduled' | 'unchanged';

export type AssignmentRecord = {
  id: number;
  student_id: string;
  advisor: UserSummary & { email: string };
  created_at: string;
};

export type AssignAdvisorResult = {
  mode: AssignmentMode;
  student: User | null;
  assignment: AssignmentRecord | null;
};

export type QueueAgingThreshold = { days: number };

export type AdminCourse = {
  id: number;
  code: string;
  title_en: string;
  title_ar: string | null;
  credits: number;
  level: number | null;
};

export type AdminProgram = {
  id: number;
  code: string;
  name_en: string;
  name_ar: string | null;
  faculty: string | null;
};

export type RegistrationWindow = {
  id: number;
  term_code: string;
  opens_at: string;
  closes_at: string;
  is_active: boolean;
};

export type AiConfiguration = {
  quota_per_student: number;
  assistant_enabled: boolean;
};
