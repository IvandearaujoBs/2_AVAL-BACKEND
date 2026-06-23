import { AppError } from "../errors/app-error.js";
import { Holiday } from "../types.js";

export interface HolidaysClient {
  listByYear(year: number): Promise<Holiday[]>;
}

export class BrasilApiHolidaysClient implements HolidaysClient {
  constructor(private readonly baseUrl: string) {}

  async listByYear(year: number): Promise<Holiday[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/feriados/v1/${year}`);

      if (!response.ok) {
        throw new Error(`BrasilAPI returned ${response.status}`);
      }

      const payload = (await response.json()) as unknown;

      if (!Array.isArray(payload)) {
        throw new Error("BrasilAPI returned an invalid payload");
      }

      return payload.map((item) => {
        const holiday = item as Record<string, unknown>;
        return {
          date: String(holiday.date),
          name: String(holiday.name),
          type: String(holiday.type),
        };
      });
    } catch {
      throw new AppError(
        502,
        "HOLIDAYS_API_UNAVAILABLE",
        "National holidays service is unavailable",
      );
    }
  }
}
