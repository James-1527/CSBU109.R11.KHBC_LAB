const mongoose = require('mongoose');

// Schema Student
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
});

// Schema Course
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  maxStudents: { type: Number, required: true },
  availableSlots: { type: Number, required: true }
});

const Student = mongoose.model('Student', studentSchema);
const Course = mongoose.model('Course', courseSchema);

// Question 1: Enroll a student in a course
async function enrollCourse(studentId, courseId) {
  const student = await Student.findById(studentId);
  const course = await Course.findById(courseId);

  if (!student) throw new Error('Student not found');
  if (!course) throw new Error('Course not found');

  // Check whether the student is already enrolled
  if (student.courses.some(id => id.equals(courseId))) {
    throw new Error('Student is already enrolled in this course');
  }

  // Check that the course still has available slots
  if (course.availableSlots <= 0) {
    throw new Error('No available slots in this course');
  }

  // Add courseId to Student.courses and studentId to Course.students
  student.courses.push(courseId);
  course.students.push(studentId);
  course.availableSlots -= 1;

  await student.save();
  await course.save();

  return { student, course };
}

// Question 2: Drop a course
async function dropCourse(studentId, courseId) {
  const student = await Student.findById(studentId);
  const course = await Course.findById(courseId);

  if (!student) throw new Error('Student not found');
  if (!course) throw new Error('Course not found');

  // Remove courseId from Student.courses and studentId from Course.students
  student.courses = student.courses.filter(id => !id.equals(courseId));
  course.students = course.students.filter(id => !id.equals(studentId));

  // Return one slot to the course
  course.availableSlots += 1;

  await student.save();
  await course.save();

  return { student, course };
}

// Demo
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/course_db');

  // Clear old data for a clean run
  await Student.deleteMany({});
  await Course.deleteMany({});

  const student = await Student.create({ name: 'An Tran' });
  const course = await Course.create({
    title: 'Web Application Development',
    maxStudents: 2,
    availableSlots: 2
  });

  await enrollCourse(student._id, course._id);
  console.log('After enroll:', await Course.findById(course._id));

  await dropCourse(student._id, course._id);
  console.log('After drop:', await Course.findById(course._id));

  await mongoose.disconnect();
}

module.exports = { Student, Course, enrollCourse, dropCourse };

if (require.main === module) {
  main().catch(err => console.error(err));
}