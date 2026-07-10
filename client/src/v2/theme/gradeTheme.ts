export interface GradePalette {
  excellent: string;
  good: string;
  satisfactory: string;
  improve: string;
  poor: string;
}

export const DEFAULT_GRADE_PALETTE: GradePalette = {
  excellent: '#EAF3DE',
  good: '#E6F1FB',
  satisfactory: '#FAEEDA',
  improve: '#FAC775',
  poor: '#FCEBEB',
};

/**
 * Applies a grade color palette by setting CSS custom properties on the root document element.
 * This allows Tailwind's dynamic grade utilities (e.g. `bg-grade-excellent`) to reflect
 * college-specific dynamic colors at runtime.
 * 
 * @param palette The grading palette to apply
 * @param targetElement The element to apply style variables on (defaults to document.documentElement)
 */
export function applyGradePalette(
  palette: GradePalette,
  targetElement: HTMLElement = document.documentElement
): void {
  targetElement.style.setProperty('--grade-excellent', palette.excellent);
  targetElement.style.setProperty('--grade-good', palette.good);
  targetElement.style.setProperty('--grade-satisfactory', palette.satisfactory);
  targetElement.style.setProperty('--grade-improve', palette.improve);
  targetElement.style.setProperty('--grade-poor', palette.poor);
}
