import { ScheduleItem, TimeSlot } from "@src/types/interfaces/campaign.types";

/**
 * Get ISO date string with time component from date and time string (HH:MM)
 */
export const getDateWithTime = (date: Date, timeString: string): Date => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

/**
 * Get next occurrence of a weekday from a given date
 */
export const getNextWeekdayOccurrence = (
  fromDate: Date,
  weekday: string
): Date => {
  const weekdayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const targetDay = weekdayMap[weekday];
  const resultDate = new Date(fromDate);

  // Set to start of day
  resultDate.setHours(0, 0, 0, 0);

  // Calculate days to add
  const currentDay = resultDate.getDay();
  let daysToAdd = targetDay - currentDay;

  // If the target day is before or same as the current day, add days to get to next week
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  resultDate.setDate(resultDate.getDate() + daysToAdd);
  return resultDate;
};

/**
 * Determine if a date is within a time range for a specific day of the week
 */
export const isInTimeSlot = (
  date: Date,
  weekday: string,
  timeSlot: TimeSlot
): boolean => {
  const weekdayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  // Check if the current day matches the schedule weekday
  if (date.getDay() !== weekdayMap[weekday]) {
    return false;
  }

  // Parse the time strings
  const [startHour, startMinute] = timeSlot.startTime.split(":").map(Number);
  const [endHour, endMinute] = timeSlot.endTime.split(":").map(Number);

  // Create date objects for the start and end times on the same day
  const startTime = new Date(date);
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);

  // Check if current time is within the time slot
  return date >= startTime && date < endTime;
};

/**
 * Check if a campaign is active based on date and schedule
 */
export const isCampaignActive = (
  currentDate: Date,
  startDate: Date,
  endDate: Date,
  schedule: ScheduleItem[]
): boolean => {
  // Check if the current date is within the campaign date range
  if (currentDate < startDate || currentDate > endDate) {
    return false;
  }

  // Check if the current date and time match any schedule item
  return schedule.some((scheduleItem) =>
    scheduleItem.timeSlots.some((timeSlot) =>
      isInTimeSlot(currentDate, scheduleItem.weekday, timeSlot)
    )
  );
};

/**
 * Calculate the next activation time for a campaign based on its schedule
 */
export const calculateNextActivation = (
  fromDate: Date,
  endDate: Date,
  schedule: ScheduleItem[]
): Date | null => {
  if (fromDate > endDate || !schedule.length) {
    return null;
  }

  // Create a copy of the from date to avoid modifying the original
  const now = new Date(fromDate);

  // Sort weekdays by their occurrence from the current date
  const weekdaysOrdered: string[] = [];
  const weekdayOccurrences = new Map<string, Date>();

  // Get the next occurrence for each weekday in the schedule
  schedule.forEach((item) => {
    const nextOccurrence = getNextWeekdayOccurrence(now, item.weekday);
    weekdaysOrdered.push(item.weekday);
    weekdayOccurrences.set(item.weekday, nextOccurrence);
  });

  // Sort weekdays by their next occurrence
  weekdaysOrdered.sort((a, b) => {
    const dateA = weekdayOccurrences.get(a)!;
    const dateB = weekdayOccurrences.get(b)!;
    return dateA.getTime() - dateB.getTime();
  });

  // Iterate through each weekday in order
  for (const weekday of weekdaysOrdered) {
    const nextWeekdayDate = weekdayOccurrences.get(weekday)!;

    if (nextWeekdayDate > endDate) {
      continue;
    }

    // Get the schedule item for this weekday
    const scheduleItem = schedule.find((item) => item.weekday === weekday)!;

    // Sort the time slots for this weekday
    const sortedTimeSlots = [...scheduleItem.timeSlots].sort((a, b) => {
      const [aHour, aMinute] = a.startTime.split(":").map(Number);
      const [bHour, bMinute] = b.startTime.split(":").map(Number);
      if (aHour !== bHour) return aHour - bHour;
      return aMinute - bMinute;
    });

    // Check if any time slot is coming up today or in the future
    for (const timeSlot of sortedTimeSlots) {
      const slotStartTime = getDateWithTime(
        nextWeekdayDate,
        timeSlot.startTime
      );

      if (slotStartTime > now && slotStartTime <= endDate) {
        return slotStartTime;
      }
    }
  }

  // If we get here, we've checked all weekdays starting from today,
  // but we need to check the next week as well
  const nextWeekStart = new Date(now);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  // Recursive call to check the next week
  if (nextWeekStart <= endDate) {
    return calculateNextActivation(nextWeekStart, endDate, schedule);
  }

  return null;
};

/**
 * Get the campaign status based on current date and campaign dates
 */
export const getCampaignStatus = (
  currentDate: Date,
  startDate: Date,
  endDate: Date
): "upcoming" | "active" | "ended" => {
  if (currentDate < startDate) {
    return "upcoming";
  }
  if (currentDate > endDate) {
    return "ended";
  }
  return "active";
};
