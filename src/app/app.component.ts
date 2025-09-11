import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yLineChartComponent, A11yLineChartDatum } from './a11y-line-chart/a11y-line-chart.component';

/**
 * Accessible performance vs target chart prototype.
 * - Years 2015-2025
 * - Actual values stop at 2020 (subsequent years unknown => gap)
 * - Toggles for showing value labels & area fills
 * - Provides off-screen data table + live region announcements
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, A11yLineChartComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'a11y-charts';

  // Updated dataset based on provided table image:
  // 2016-2020 Actuals ("Data" row) & Targets ("Target >=" row)
  // Followed by forward-looking Targets 2021-2025
  performanceData: A11yLineChartDatum[] = [
    { year: 2016, actual: 68.90, target: 80.00 },
    { year: 2017, actual: 70.32, target: 80.00 },
    { year: 2018, actual: 69.06, target: 80.00 },
    { year: 2019, actual: 72.51, target: 80.00 },
    { year: 2020, actual: 83.92, target: 77.02 },
    // No actuals yet for out-years; targets only
    { year: 2021, target: 78.27 },
    { year: 2022, target: 79.52 },
    { year: 2023, target: 80.77 },
    { year: 2024, target: 82.02 },
    { year: 2025, target: 83.27 }
  ];

  // Assessment / Historical dataset (POC) based on screenshot tables
  // Historical Data (2015-2019) + Baseline 2020 + Forward Targets 2020-2025
  assessmentData: A11yLineChartDatum[] = [
    { year: 2015, actual: 57.12, target: 80.00 },
    { year: 2016, actual: 64.15, target: 80.00 },
    { year: 2017, actual: 65.34, target: 80.00 },
    { year: 2018, actual: 63.53, target: 80.00 },
    { year: 2019, actual: 64.26, target: 80.00 },
    { year: 2020, actual: 70.78, target: 70.78 }, // baseline year
    { year: 2021, target: 70.78 },
    { year: 2022, target: 70.78 },
    { year: 2023, target: 70.78 },
    { year: 2024, target: 72.30 },
    { year: 2025, target: 73.50 }
  ];

  a11yConfig = {
    announceChanges: true,
    showTable: true,
  decimalPlaces: 2, // keep data precision for labels/tooltips
  axisDecimalPlaces: 0, // y-axis ticks as whole numbers only
    autoDetectGaps: true,
    describeMissingAs: '-',
    wrapAround: true
  };

}
