import { CustomError } from './util';

export class PageValidator {
  public static validate(
    page: Pagination,
    minimumValue: number
  ): Pagination | undefined {
    if (isNaN(page.startIndex) || isNaN(page.limit)) {
      return undefined;
    } else if (page.startIndex < minimumValue || page.limit < 0) {
      throw new CustomError(400, 'PAGE_START_INDEX_OR LIMIT_IS_INVALID');
    } else if (page.startIndex > 0 && page.limit < 1) {
      throw new CustomError(
        400,
        `WHEN_AN_INDEX_IS_PRESENT,_THE_LIMIT_MUST_BE_GREATER_THAN_0`
      );
    }
    return page;
  }
}
