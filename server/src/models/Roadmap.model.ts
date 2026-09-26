import mongoose, { Schema, type Document } from 'mongoose';

export interface RoadmapCourseRef {
  courseId: string;
  order: number;
  isRequired: boolean;
}

export interface RoadmapFeature {
  icon?: string;
  label: string;
}

export interface RoadmapSellingPoint {
  icon?: string;
  title: string;
  subtitle?: string;
}

export interface RoadmapCurriculumModule {
  title: string;
  lessons: number;
  duration?: string;
  items: string[];
}

export interface RoadmapInstructorLink {
  label: string;
  url: string;
}

export interface RoadmapInstructor {
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  links?: RoadmapInstructorLink[];
}

export interface RoadmapFaqItem {
  question: string;
  answer: string;
}

export interface RoadmapProject {
  title: string;
  subtitle?: string;
  image?: string;
}

export interface RoadmapDocument extends Document {
  title: string;
  slug: string;
  description: string;

  tagline?: string;
  tags?: string[];
  badge?: 'LIVE' | 'NEW' | 'POPULAR' | 'STARTING SOON';
  thumbnail?: string;
  heroVideoUrl?: string;

  courses: RoadmapCourseRef[];

  isFree: boolean;
  price?: number;
  originalPrice?: number;

  features?: RoadmapFeature[];
  sellingPoints?: RoadmapSellingPoint[];
  sellingHeadline?: string;
  learningOutcomes?: string[];
  curriculum?: RoadmapCurriculumModule[];
  projects?: RoadmapProject[];
  instructor?: RoadmapInstructor;
  certificateIncluded?: boolean;
  faq?: RoadmapFaqItem[];

  published: boolean;
  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
}

/* ─── Sub-schemas ────────────────────────────────────────────────── */

const featureSchema = new Schema<RoadmapFeature>(
  {
    icon: { type: String },
    label: { type: String, required: true },
  },
  { _id: false }
);

const sellingPointSchema = new Schema<RoadmapSellingPoint>(
  {
    icon: { type: String },
    title: { type: String, required: true },
    subtitle: { type: String },
  },
  { _id: false }
);

const curriculumModuleSchema = new Schema<RoadmapCurriculumModule>(
  {
    title: { type: String, required: true },
    lessons: { type: Number, required: true, min: 0 },
    duration: { type: String },
    items: { type: [String], default: [] },
  },
  { _id: false }
);

const instructorLinkSchema = new Schema<RoadmapInstructorLink>(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const instructorSchema = new Schema<RoadmapInstructor>(
  {
    name: { type: String, required: true },
    role: { type: String },
    bio: { type: String },
    avatar: { type: String },
    links: { type: [instructorLinkSchema], default: [] },
  },
  { _id: false }
);

const faqItemSchema = new Schema<RoadmapFaqItem>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const projectSchema = new Schema<RoadmapProject>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    image: { type: String },
  },
  { _id: false }
);

const courseRefSchema = new Schema<RoadmapCourseRef>(
  {
    courseId: { type: String, required: true },
    order: { type: Number, required: true, min: 1 },
    isRequired: { type: Boolean, default: true },
  },
  { _id: false }
);

/* ─── Roadmap schema ─────────────────────────────────────────────── */

const roadmapSchema = new Schema<RoadmapDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },

    tagline: { type: String, trim: true },
    tags: { type: [String], default: [] },
    badge: {
      type: String,
      enum: ['LIVE', 'NEW', 'POPULAR', 'STARTING SOON'],
      default: undefined,
    },
    thumbnail: { type: String },
    heroVideoUrl: { type: String },

    courses: { type: [courseRefSchema], default: [] },

    isFree: { type: Boolean, default: true, index: true },
    price: { type: Number, min: 0, default: undefined },
    originalPrice: { type: Number, min: 0, default: undefined },

    features: { type: [featureSchema], default: [] },
    sellingPoints: { type: [sellingPointSchema], default: [] },
    sellingHeadline: { type: String },
    learningOutcomes: { type: [String], default: [] },
    curriculum: { type: [curriculumModuleSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    instructor: { type: instructorSchema, default: undefined },
    certificateIncluded: { type: Boolean, default: false },
    faq: { type: [faqItemSchema], default: [] },

    published: { type: Boolean, default: false, index: true },
    createdBy: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

roadmapSchema.index({ published: 1, createdAt: -1 });
roadmapSchema.index({ 'courses.courseId': 1 });

export const Roadmap = mongoose.model<RoadmapDocument>(
  'Roadmap',
  roadmapSchema
);