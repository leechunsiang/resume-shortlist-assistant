import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format text description into structured sections with bullet points
 * Detects common section headers and formats content accordingly
 */
export function formatDescription(description: string): { 
  sections: Array<{ title: string; items: string[] }>;
  hasStructure: boolean;
} {
  if (!description) {
    return { sections: [], hasStructure: false };
  }

  const sections: Array<{ title: string; items: string[] }> = [];
  
  // Split by lines (preserve empty lines for spacing detection)
  const lines = description.split('\n');
  
  let currentSection: { title: string; items: string[] } | null = null;
  let hasStructure = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (line.length === 0) continue;

    // Check if line is a section header (ends with colon and not a bullet point)
    const isSectionHeader = line.endsWith(':') && !line.match(/^[\u2022\u2023\u25E6\u2043\u2219\-\*•]\s/);
    
    if (isSectionHeader) {
      // Save previous section if exists
      if (currentSection && currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        title: line.replace(':', '').trim(),
        items: []
      };
      hasStructure = true;
    } else {
      // Check if it's a bullet point or list item
      const bulletMatch = line.match(/^[\u2022\u2023\u25E6\u2043\u2219\-\*•]\s*(.+)$/);
      if (bulletMatch) {
        hasStructure = true;
        if (currentSection) {
          currentSection.items.push(bulletMatch[1].trim());
        } else {
          // Create default section if no header found yet
          currentSection = { title: 'Description', items: [bulletMatch[1].trim()] };
        }
      } else if (line.length > 0) {
        // Regular text line (not a header, not a bullet)
        if (currentSection) {
          currentSection.items.push(line);
        } else {
          // Create default section
          currentSection = { title: 'Description', items: [line] };
        }
      }
    }
  }

  // Add last section
  if (currentSection && currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return { sections, hasStructure };
}
