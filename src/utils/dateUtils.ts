export class DateUtils {
  // 애플리케이션 서버의 타임존을 고려하여 Date타입을 재가공 (ex. 2021-08-01T00:00:00.000Z -> 2021-08-01 00:00:00)
  public static formatDate(date: Date): string {
    const localDateTime: Date = new Date(
      date.getTime() - date.getTimezoneOffset() * 60 * 1000
    );

    return localDateTime.toISOString().substring(0, 19).replace('T', ' ');
  }

  // DB에서 가져오는 반환 값 중 Date 타입의 모든 값을 formatDate 함수로 처리해주는 클래스 및 함수
  // typeORM Entities의 options 중 transformer를 사용하지 않고 service 로직에서 처리를 할 때 사용
  public static async processDateValues(result: any): Promise<any> {
    // 쿼리 실행 후에 반환된 결과를 가공
    if (Array.isArray(result)) {
      // 반환된 결과가 배열인 경우
      return result.map(item => this.processItem(item));
    } else {
      // 반환된 결과가 단일 객체인 경우
      return this.processItem(result);
    }
  }

  private static processItem(item: any): any {
    // 객체의 모든 속성을 순회하면서 Date 타입인 경우에만 가공
    for (const key in item) {
      if (item.hasOwnProperty(key) && item[key] instanceof Date) {
        item[key] = DateUtils.formatDate(item[key]);
      } else if (typeof item[key] === 'object') {
        // 객체인 경우 재귀적으로 processItem 호출
        item[key] = this.processItem(item[key]);
      }
    }
    return item;
  }
}
