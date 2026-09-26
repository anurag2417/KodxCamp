import { Router } from 'express';
import {
  paymentController,
  createOrderSchema,
  verifyCheckoutSchema,
  enrollFreeSchema,
} from '../controllers/payment.controller.js';
import {
  enrollmentStatusController,
  enrollmentStatusQuerySchema,
} from '../controllers/enrollmentStatus.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public config endpoint - returns whether payments are enabled.
// Deliberately unauthenticated so the landing page can decide what to
// show without requiring a session.
router.get('/config', paymentController.config);

// Everything else requires login.
router.post(
  '/create-order',
  requireAuth,
  validate(createOrderSchema),
  paymentController.createOrder
);
router.post(
  '/verify',
  requireAuth,
  validate(verifyCheckoutSchema),
  paymentController.verify
);
router.post(
  '/enroll-free',
  requireAuth,
  validate(enrollFreeSchema),
  paymentController.enrollFree
);

// CHANGED: new endpoint. Reports whether the caller is enrolled in a
// given course or roadmap. Used by CourseDetail / RoadmapDetail to
// choose between "Enroll" and "Continue" CTAs.
router.get(
  '/enrollment-status',
  requireAuth,
  validate(enrollmentStatusQuerySchema),
  enrollmentStatusController.get
);

// NOTE: /webhook is not mounted here. It's mounted separately in
// app.ts before the JSON body parser, so the raw body is preserved for
// signature verification. See app.ts.

export default router;