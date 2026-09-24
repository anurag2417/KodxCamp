import mongoose, { Schema, type Document } from 'mongoose';

type CourseLanguage = string;

export interface CourseFeature {
  icon?: string;
  label: string;
}

export interface CourseSellingPoint {
  icon?: string;
  title: string;
  subtitle?: string;
}

export interface CourseCurriculumModule {
  title: string;
  lessons: number;
  duration?: string;
  items: string[];
}

export interface CourseInstructorLink {
  label: string;
  url: string;
}

export interface CourseInstructor {
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  links?: CourseInstructorLink[];
}

export interface CourseFaqItem {
  question: string;
  answer: string;
}

export interface CourseProject {
  title: string;
  subtitle?: string;
  image?: string;
}

export interface CourseDocument extends Document {
  title: string;
  slug: string;
  description: string;
  language: CourseLanguage;
  courseType: string;
  thumbnail?: string;
  totalLessons: number;
  createdBy: string;
  published: boolean;

  // Pricing
  price?: number;
  originalPrice?: number;
  isFree: boolean;

  // Display (all optional, all additive)
  tagline?: string;
  tags?: string[];
  badge?: 'LIVE' | 'NEW' | 'POPULAR' | 'STARTING SOON';
  heroVideoUrl?: string;
  features?: CourseFeature[];
  sellingPoints?: CourseSellingPoint[];
  sellingHeadline?: string;
  learningOutcomes?: string[];
  curriculum?: CourseCurriculumModule[];
  projects?: CourseProject[];
  instructor?: CourseInstructor;
  certificateIncluded?: boolean;
  faq?: CourseFaqItem[];

  createdAt: Date;
  updatedAt: Date;
}

const featureSchema = new Schema<CourseFeature>(
  {
    icon: { type: String },
    label: { type: String, required: true },
  },
  { _id: false }
);

const sellingPointSchema = new Schema<CourseSellingPoint>(
  {
    icon: { type: String },
    title: { type: String, required: true },
    subtitle: { type: String },
  },
  { _id: false }
);

const curriculumModuleSchema = new Schema<CourseCurriculumModule>(
  {
    title: { type: String, required: true },
    lessons: { type: Number, required: true, min: 0 },
    duration: { type: String },
    items: { type: [String], default: [] },
  },
  { _id: false }
);

const instructorLinkSchema = new Schema<CourseInstructorLink>(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const instructorSchema = new Schema<CourseInstructor>(
  {
    name: { type: String, required: true },
    role: { type: String },
    bio: { type: String },
    avatar: { type: String },
    links: { type: [instructorLinkSchema], default: [] },
  },
  { _id: false }
);

const faqItemSchema = new Schema<CourseFaqItem>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const projectSchema = new Schema<CourseProject>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    image: { type: String },
  },
  { _id: false }
);

const courseSchema = new Schema<CourseDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    language: { type: String, required: true },
    courseType: { type: String, default: 'general', trim: true },
    thumbnail: { type: String },
    totalLessons: { type: Number, default: 0 },
    createdBy: { type: String, required: true, index: true },
    published: { type: Boolean, default: false, index: true },

    price: { type: Number, min: 0, default: undefined },
    originalPrice: { type: Number, min: 0, default: undefined },
    isFree: { type: Boolean, default: true, index: true },

    tagline: { type: String, trim: true },
    tags: { type: [String], default: [] },
    badge: {
      type: String,
      enum: ['LIVE', 'NEW', 'POPULAR', 'STARTING SOON'],
      default: undefined,
    },
    heroVideoUrl: { type: String },
    features: { type: [featureSchema], default: [] },
    sellingPoints: { type: [sellingPointSchema], default: [] },
    sellingHeadline: { type: String },
    learningOutcomes: { type: [String], default: [] },
    curriculum: { type: [curriculumModuleSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    instructor: { type: instructorSchema, default: undefined },
    certificateIncluded: { type: Boolean, default: false },
    faq: { type: [faqItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Course = mongoose.model<CourseDocument>('Course', courseSchema);