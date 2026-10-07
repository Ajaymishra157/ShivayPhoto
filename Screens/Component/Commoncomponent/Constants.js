// constants.js

import { Calendar } from "react-native-paper-dates";

const Fonts = {
  Regular: 'Inter-Regular',
  Medium: 'Inter-Medium',
  Semibold: 'Inter-SemiBold',
  Bold: 'Inter-Bold',
};

const Colors = {
  appcolor: '#ffffff',
  lightappcolor: '#e5e3f5',
  productcolor: '#fbf2d3',
  partycolor: '#fdfbf1',

  buttonbgcolor: '#7367f0',
  light_buttonbgcolor: '#8f85f3',
  btntext: '#fff',

  PLACEHOLDER: '#999999',
  ICON: '#000',
  text: '#000',
  white: '#fff',
  listtext: '#444',
  inputtextbgc: '#fff',
};

// const BASE_URL = 'https://crm.shivayphoto.com/dev/api/';
// const BASE_URL = 'https://crm.shivayphoto.com/api/';

const BASE_URL = 'https://shivayphoto.studiomanagers.in/api/';
// const BASE_URL = 'https://shivayphoto.studiomanagers.in/dev/api/';


const API = {
  BASE_URL,

  login: `${BASE_URL}login.php`,

  // users
  list_user: `${BASE_URL}users/list_user.php`,
  detail_user: `${BASE_URL}users/detail_user.php`,
  delete_user: `${BASE_URL}users/delete_user.php`,
  add_user: `${BASE_URL}users/add_user.php`,
  update_user: `${BASE_URL}users/update_user.php`,
  status_update: `${BASE_URL}users/status_update.php`,
  change_password: `${BASE_URL}users/change_password.php`,
  list_usertype: `${BASE_URL}users/list_usertype.php`,
  list_user_typewise: `${BASE_URL}users/list_user_typewise.php`,



  // source
  list_source: `${BASE_URL}source/list_source.php`,
  detail_source: `${BASE_URL}source/detail_source.php`,
  delete_source: `${BASE_URL}source/delete_source.php`,
  add_source: `${BASE_URL}source/add_source.php`,
  update_source: `${BASE_URL}source/update_source.php`,
  source_status_update: `${BASE_URL}source/status_update.php`,

  // purpose

  list_purpose: `${BASE_URL}purpose/list_purpose.php`,
  detail_purpose: `${BASE_URL}purpose/detail_purpose.php`,
  delete_purpose: `${BASE_URL}purpose/delete_purpose.php`,
  add_purpose: `${BASE_URL}purpose/add_purpose.php`,
  update_purpose: `${BASE_URL}purpose/update_purpose.php`,
  purpose_status_update: `${BASE_URL}purpose/status_update.php`,

  // Leads
  add_lead: `${BASE_URL}lead/add_lead.php`,
  list_lead: `${BASE_URL}lead/list_lead.php`,
  detail_lead: `${BASE_URL}lead/detail_lead.php`,
  delete_lead: `${BASE_URL}lead/delete_lead.php`,
  update_lead: `${BASE_URL}lead/update_lead.php`,
  add_status: `${BASE_URL}lead/add_status.php`,
  list_status: `${BASE_URL}lead/list_status.php`,
  active_purpose_list: `${BASE_URL}lead/active_purpose_list.php`,
  active_source_list: `${BASE_URL}lead/active_source_list.php`,


  // Report
  month_report: `${BASE_URL}report/month_report.php`,
  mix_report: `${BASE_URL}report/mix_report.php`,

  // Lead Transfer
  list_lead_transfer: `${BASE_URL}lead_transfer/list_lead.php`,
  update_lead_transfer: `${BASE_URL}lead_transfer/update_lead.php`,
  list_staff: `${BASE_URL}lead_transfer/list_staff.php`,


  // Booking
  list_booking: `${BASE_URL}booking/list_booking.php`,
  add_booking: `${BASE_URL}booking/add_booking.php`,
  detail_booking: `${BASE_URL}booking/detail_booking.php`,
  delete_booking: `${BASE_URL}booking/delete_booking.php`,
  update_booking: `${BASE_URL}booking/update_booking.php`,
  sent_otp: `${BASE_URL}booking/sent_otp.php`,
  verify_otp: `${BASE_URL}booking/verify_otp.php`,

  // Calendar
  list_calendar: `${BASE_URL}calendar/list_calender.php`,
  update_date: `${BASE_URL}calendar/update_date.php`,

  state_list: `${BASE_URL}list_state.php`,
  city_list: `${BASE_URL}list_city.php`,


  // Coordination
  assign_editor: `${BASE_URL}coordination/assign_editor.php`,
  assign_editor_coordinator: `${BASE_URL}coordination/assign_editor_coordinator.php`,
  create_task: `${BASE_URL}coordination/create_task.php`,
  photographer_status: `${BASE_URL}coordination/photographer_status.php`,
  task_status: `${BASE_URL}coordination/task_status.php`,

  // Payments (CRUD)
  payment_list: `${BASE_URL}manage_payment/payment_list.php`,
  payment_add: `${BASE_URL}manage_payment/payment_add.php`,
  payment_update: `${BASE_URL}manage_payment/payment_update.php`,
  payment_delete: `${BASE_URL}manage_payment/payment_delete.php`,


  // Dashboard
  counting: `${BASE_URL}dashboard/counting.php`,
  followup_api: `${BASE_URL}dashboard/followup_api.php`,


  // Coordination
  assign_photographer: `${BASE_URL}coordination/assign_photographer.php`,
  update_stage: `${BASE_URL}coordination/coordination_update_stage.php`,


  // Coordination
  coordinator_wise_list: `${BASE_URL}coordination/coordinator_wise_list.php`,
  coordination_booking_detail: `${BASE_URL}coordination/coordination_booking_detail.php`,
  photographer_assignments_list: `${BASE_URL}coordination/photographer_assignments_list.php`,

  list_photographer_couting: `${BASE_URL}photographer/list_photographer_couting.php`,
  my_assignments: `${BASE_URL}photographer/my_assignments.php`,

  photographer_mark_done: `${BASE_URL}coordination/photographer_mark_done.php`,


  list_editor_assignment: `${BASE_URL}codinator_editer/list_editor_assignment.php`,
  booking_task: `${BASE_URL}codinator_editer/booking_task.php`,


  list_post_production: `${BASE_URL}post_production/list_post_production.php`,
  assign_editor_workflow: `${BASE_URL}post_production/assign_editor_workflow.php`,


  editor_dashboard: `${BASE_URL}editor/editor_dashboard.php`,
  editor_tasks: `${BASE_URL}editor/editor_tasks.php`,
  status_change: `${BASE_URL}editor/status_change.php`,


  today_shoot_list: `${BASE_URL}coordination/today_shoot_list.php`,


  notification_list: `${BASE_URL}photographer/notification_list.php`,


  add_branch: `${BASE_URL}branch/add_branch.php`,
  update_branch: `${BASE_URL}branch/update_branch.php`,
  list_branch: `${BASE_URL}branch/list_branch.php`,
  delete_branch: `${BASE_URL}branch/delete_branch.php`,

  add_package: `${BASE_URL}package/add_package.php`,
  update_package: `${BASE_URL}package/update_package.php`,
  list_package: `${BASE_URL}package/list_package.php`,
  delete_package: `${BASE_URL}package/delete_package.php`,

  coordination_next_days: `${BASE_URL}coordination/coordination_next_days.php`,

  //coordination detail ke andar shoot date update ke liye
  // update_booking_date: `${BASE_URL}coordination/update_booking_date.php`,






  shoot_schedule: `${BASE_URL}dashboard/shoot_schedule.php`,
  dashboard_api: `${BASE_URL}dashboard/dashboard_api.php`,




























































};

export { Fonts, Colors, API };
