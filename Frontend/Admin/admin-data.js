/* =========================================================
   admin-data.js  -  TEMPORARY dummy data

   Every list below is shaped like a future database table
   (snake_case column names, ids, owner_id as a foreign key).
   When the backend is ready, each array gets replaced with
   something like:  AdminData.users = await fetch("/api/admin/users")
   ========================================================= */

const AdminData = {

  // table: users
  users: [
    { id: 1, full_name: "Ayesha Rehman",  email: "ayesha@email.com",  role: "owner", status: "active",  joined_at: "2026-10-14" },
    { id: 2, full_name: "Imran Siddiqui", email: "imran@email.com",   role: "owner", status: "active",  joined_at: "2026-10-02" },
    { id: 3, full_name: "Sarah Khan",     email: "sarah@email.com",   role: "owner", status: "active",  joined_at: "2026-09-21" },
    { id: 4, full_name: "Saleha Khan",    email: "saleha@email.com",  role: "owner", status: "active",  joined_at: "2026-09-10" },
    { id: 5, full_name: "Bilal Ahmed",    email: "bilal@email.com",   role: "owner", status: "blocked", joined_at: "2026-08-17" },
    { id: 6, full_name: "Admin",          email: "admin@pawcare.com", role: "admin", status: "active",  joined_at: "2026-06-01" }
  ],

  // table: pets  (owner_id -> users.id)
  pets: [
    { id: 1,  owner_id: 4, name: "Max",    species: "Dog",    breed: "Golden Retriever", gender: "Male",   dob: "2023-05-12", weight_kg: 24,  health_status: "Healthy" },
    { id: 2,  owner_id: 4, name: "Luna",   species: "Cat",    breed: "Persian Cat",      gender: "Female", dob: "2022-03-08", weight_kg: 4.2, health_status: "Healthy" },
    { id: 3,  owner_id: 4, name: "Coco",   species: "Rabbit", breed: "Holland Lop",      gender: "Female", dob: "2025-09-20", weight_kg: 1.8, health_status: "Healthy" },
    { id: 4,  owner_id: 1, name: "Bella",  species: "Dog",    breed: "Labrador",         gender: "Female", dob: "2024-01-15", weight_kg: 19,  health_status: "Healthy" },
    { id: 5,  owner_id: 1, name: "Oreo",   species: "Cat",    breed: "British Shorthair",gender: "Male",   dob: "2023-11-02", weight_kg: 5.1, health_status: "Needs attention" },
    { id: 6,  owner_id: 2, name: "Rocky",  species: "Dog",    breed: "German Shepherd",  gender: "Male",   dob: "2021-07-30", weight_kg: 33,  health_status: "Healthy" },
    { id: 7,  owner_id: 3, name: "Milo",   species: "Cat",    breed: "Siamese",          gender: "Male",   dob: "2024-04-04", weight_kg: 4.6, health_status: "Healthy" },
    { id: 8,  owner_id: 3, name: "Daisy",  species: "Rabbit", breed: "Mini Rex",         gender: "Female", dob: "2025-02-11", weight_kg: 1.6, health_status: "Healthy" },
    { id: 9,  owner_id: 3, name: "Kiwi",   species: "Bird",   breed: "Budgie",           gender: "Male",   dob: "2025-06-01", weight_kg: 0.04,health_status: "Healthy" }
  ],

  // table: appointments  (pet_id -> pets.id)
  appointments: [
    { id: 1, pet_id: 2, vet_name: "Dr. Ahmed", appointment_date: "2026-10-15", appointment_time: "16:00", reason: "Regular checkup", status: "upcoming" },
    { id: 2, pet_id: 1, vet_name: "Dr. Sara",  appointment_date: "2026-10-28", appointment_time: "11:30", reason: "Vaccination",     status: "upcoming" },
    { id: 3, pet_id: 1, vet_name: "Dr. Ahmed", appointment_date: "2026-09-03", appointment_time: "10:00", reason: "Checkup",         status: "completed" },
    { id: 4, pet_id: 6, vet_name: "Dr. Sara",  appointment_date: "2026-10-18", appointment_time: "09:30", reason: "Skin allergy",    status: "upcoming" },
    { id: 5, pet_id: 5, vet_name: "Dr. Ahmed", appointment_date: "2026-10-09", appointment_time: "14:00", reason: "Weight check",    status: "cancelled" }
  ],

  // table: vaccinations  (pet_id -> pets.id). The status is worked out from next_due.
  vaccinations: [
    { id: 1, pet_id: 1, vaccine_name: "Rabies",      given_on: "2025-10-17", next_due: "2026-10-17" },
    { id: 2, pet_id: 1, vaccine_name: "Distemper",   given_on: "2024-11-15", next_due: "2025-11-15" },
    { id: 3, pet_id: 1, vaccine_name: "Parvovirus",  given_on: "2025-12-20", next_due: "2026-12-20" },
    { id: 4, pet_id: 1, vaccine_name: "Bordetella",  given_on: "2026-03-02", next_due: "2027-03-02" },
    { id: 5, pet_id: 2, vaccine_name: "FVRCP",       given_on: "2025-11-20", next_due: "2026-11-20" },
    { id: 6, pet_id: 6, vaccine_name: "Rabies",      given_on: "2025-10-01", next_due: "2026-10-01" }
  ],

  // table: articles
  articles: [
    { id: 1, title: "How often should dogs be vaccinated?", category: "Dogs",    summary: "A simple schedule from puppyhood to senior years.", author: "Dr. Sara",  status: "published", published_on: "2026-09-12" },
    { id: 2, title: "Basic grooming guide",                 category: "Cats",    summary: "Brushing, bathing and nail care made easy.",       author: "Admin",     status: "published", published_on: "2026-10-14" },
    { id: 3, title: "Signs your pet needs a vet",           category: "All",     summary: "Seven behaviours you shouldn't ignore.",           author: "Dr. Ahmed", status: "published", published_on: "2026-08-30" },
    { id: 4, title: "Caring for a Holland Lop",             category: "Rabbits", summary: "Diet, housing and handling tips.",                 author: "Admin",     status: "draft",     published_on: null }
  ],

  // Only for the dashboard feed. In the backend this could come from an activity_log table.
  activity: [
    { icon: "bi-person",         title: "New user registered", detail: "Ayesha R.",       time: "2 min ago" },
    { icon: "bi-heart",          title: "New pet added",       detail: "Bella",           time: "14 min ago" },
    { icon: "bi-calendar-check", title: "Appointment booked",  detail: "Dr. Sara",        time: "1 hr ago" },
    { icon: "bi-journal-text",   title: "Article published",   detail: "Grooming guide",  time: "3 hr ago" }
  ]
};
