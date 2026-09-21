export type CourseTeamRole = 'lead' | 'author' | 'ta';

export type EffectiveCourseRole = 'admin' | CourseTeamRole;

interface UserLike {
  _id: string;
  role: string;
}

interface CourseLike {
  createdBy: string;
  members: { userId: string; role: CourseTeamRole }[];
}

export const permissions = {
  /**
   * Is this user allowed to see/manage this course at all?
   * Any team member or the creator or any admin.
   */
  canAccessCourse(user: UserLike, course: CourseLike): boolean {
    if (user.role === 'admin') return true;
    if (course.createdBy === user._id) return true;
    return course.members.some((m) => m.userId === user._id);
  },

  /**
   * What is this user's effective role on this course?
   * Returns:
   *   'admin' for global admins
   *   'lead' for creators (implicit)
   *   the team role for members
   *   null if they have no access
   */
  courseRole(user: UserLike, course: CourseLike): EffectiveCourseRole | null {
    if (user.role === 'admin') return 'admin';
    if (course.createdBy === user._id) return 'lead';
    const m = course.members.find((x) => x.userId === user._id);
    return m ? (m.role as CourseTeamRole) : null;
  },

  /** Can this user create/edit/delete lessons and content in this course? */
  canEditContent(user: UserLike, course: CourseLike): boolean {
    const r = permissions.courseRole(user, course);
    return r === 'admin' || r === 'lead' || r === 'author';
  },

  /** Can this user publish/unpublish the course and delete it? */
  canManageCourse(user: UserLike, course: CourseLike): boolean {
    const r = permissions.courseRole(user, course);
    return r === 'admin' || r === 'lead';
  },

  /** Can this user add/remove team members? */
  canManageTeam(user: UserLike, course: CourseLike): boolean {
    const r = permissions.courseRole(user, course);
    return r === 'admin' || r === 'lead';
  },

  /** Can this user see the student roster for classes in this course? */
  canViewStudents(user: UserLike, course: CourseLike): boolean {
    const r = permissions.courseRole(user, course);
    return (
      r === 'admin' || r === 'lead' || r === 'author' || r === 'ta'
    );
  },

  /** Can this user create/update/delete classes for this course? */
  canManageClasses(user: UserLike, course: CourseLike): boolean {
    const r = permissions.courseRole(user, course);
    return r === 'admin' || r === 'lead' || r === 'author';
  },
};