/**
 * Simple & Direct Clash Report Generator
 */

function generateReport(clashes, metadata) {
  const timestamp = new Date().toLocaleString();
  
  // Header
  let report = `BIM SMART ROUTE - SIMPLE CLASH REPORT\n`;
  report += `=====================================\n`;
  report += `Project: ${metadata.project}\n`;
  report += `Date: ${timestamp}\n`;
  report += `System Accuracy: ${(metadata.processingAccuracy * 100).toFixed(1)}%\n\n`;

  // Quick Summary
  const hardCount = clashes.filter(c => c.type === 'hard').length;
  const softCount = clashes.filter(c => c.type === 'soft').length;

  report += `QUICK SUMMARY\n`;
  report += `-------------\n`;
  report += `Total Clashes Found: ${clashes.length}\n`;
  report += `- Hard Physical Clashes: ${hardCount}\n`;
  report += `- Soft Clearance Clashes: ${softCount}\n\n`;

  // Simplified Clash Log
  report += `CLASH LOG (LOCATION & TYPE)\n`;
  report += `---------------------------\n`;

  if (clashes.length === 0) {
    report += `No clashes detected in the current model.\n`;
  } else {
    clashes.forEach((clash, index) => {
      const type = clash.type.toUpperCase();
      const pos = `X:${clash.point.x.toFixed(0)}, Y:${clash.point.y.toFixed(0)}, Z:${clash.point.z.toFixed(0)}`;
      
      report += `[${index + 1}] ${type} CLASH at (${pos})\n`;
      report += `    Between: ${clash.elementA.name} and ${clash.elementB.name}\n`;
      
      if (clash.suggestedReroute) {
        report += `    REROUTE: ${clash.suggestedReroute.description}\n`;
        if (clash.suggestedReroute.secondaryConflict) {
          report += `    WARNING: Possible secondary conflict with ${clash.suggestedReroute.secondaryConflict}\n`;
        }
      }
      report += `\n`;
    });
  }

  report += `=====================================\n`;
  report += `End of Simple Report\n`;

  return {
    text: report,
    json: {
      metadata: {
        ...metadata,
        reportTimestamp: timestamp,
        summary: {
          total: clashes.length,
          hard: hardCount,
          soft: softCount
        }
      },
      reroutingSchedule: clashes.map(c => ({
        taskId: c.id,
        priority: c.type === 'hard' ? 'CRITICAL' : 'MEDIUM',
        targetElement: c.suggestedReroute.elementId,
        instruction: c.suggestedReroute.description,
        coordinates: c.point
      }))
    }
  };
}

module.exports = { generateReport };
