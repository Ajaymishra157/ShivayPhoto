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
  btntext: '#fff',

  PLACEHOLDER: '#999999',
  ICON: '#000',
  text: '#000',
  white: '#fff',
  listtext: '#444',
  inputtextbgc: '#fff',
};

// const BASE_URL = 'https://crm.shivayphoto.com/dev/api/';
const BASE_URL = 'https://crm.shivayphoto.com/api/';

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

  // Dashboard
  counting: `${BASE_URL}dashboard/counting.php`,
  followup_api: `${BASE_URL}dashboard/followup_api.php`,








































};

export { Fonts, Colors, API };
