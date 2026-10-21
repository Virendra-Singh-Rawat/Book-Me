const toGoogleDateTime = (date, time) => {
  const formattedDate = date.replaceAll("-", "");
  const formattedTime = time.replace(":", "");

  return `${formattedDate}T${formattedTime}00`;
};

export const buildCustomerCalendarUrl = ({ business, service, booking }) => {
  const businessName = business.businessName || business.name;

  const startDateTime = toGoogleDateTime(booking.date, booking.startTime);

  const endDateTime = toGoogleDateTime(booking.date, booking.endTime);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${service.name} with ${businessName}`,
    dates: `${startDateTime}/${endDateTime}`,
    details: booking.notes || `Booking with ${businessName}`,
    ctz: business.timezone || "Asia/Kolkata",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
