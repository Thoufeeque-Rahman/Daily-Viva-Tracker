export const secondaryColors = {
  excellent: {
    card: "bg-gradient-to-br from-blue-50 to-indigo-100",
    header: "bg-gradient-to-r from-blue-600 to-indigo-600",
    text: "text-blue-600",
    icon: "text-blue-600",
  },
  good: {
    card: "bg-gradient-to-br from-amber-50 to-orange-100",
    header: "bg-gradient-to-r from-amber-600 to-orange-600",
    text: "text-amber-600",
    icon: "text-amber-600",
  },
  poor: {
    card: "bg-gradient-to-br from-red-50 to-orange-100",
    header: "bg-gradient-to-r from-red-600 to-orange-600",
    text: "text-red-600",
    icon: "text-red-600",
  },
};

export const performanceColors = {
  excellent: {
    card: "bg-gradient-to-br from-emerald-50 to-green-100",
    header: "bg-gradient-to-r from-emerald-500 to-green-600",
    text: "text-emerald-600",
    icon: "text-emerald-600",
  },
  good: {
    card: "bg-gradient-to-br from-yellow-50 to-amber-100",
    header: "bg-gradient-to-r from-yellow-500 to-amber-600",
    text: "text-yellow-600",
    icon: "text-yellow-600",
  },
  poor: {
    card: "bg-gradient-to-br from-rose-50 to-red-100",
    header: "bg-gradient-to-r from-rose-500 to-red-600",
    text: "text-rose-600",
    icon: "text-rose-600",
  },
};

export const getPerformanceColors = (percentage: number) => {
  if (percentage >= 80) {
    return performanceColors.excellent;
  } else if (percentage >= 50) {
    return performanceColors.good;
  } else {
    return performanceColors.poor;
  }
};

export const getSecondaryColors = (percentage: number) => {
  if (percentage >= 80) {
    return secondaryColors.excellent;
  } else if (percentage >= 60) {
    return secondaryColors.good;
  } else {
    return secondaryColors.poor;
  }
};

export const getMarkColors = (mark: number) => {
  switch (mark) {
    case 2:
      return performanceColors.excellent;
    case 1:
      return performanceColors.good;
    case 0:
      return performanceColors.poor;
    default:
      return performanceColors.poor;
  }
};

export const getSecondaryMarkColors = (mark: number) => {
  switch (mark) {
    case 2:
      return secondaryColors.excellent;
    case 1:
      return secondaryColors.good;
    case 0:
      return secondaryColors.poor;
    default:
      return secondaryColors.poor;
  }
}; 