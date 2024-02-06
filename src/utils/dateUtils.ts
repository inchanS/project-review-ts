export class DateUtils {
  // TODO Date타입 반환되는 API에서 모두 아래 메서드 처리하기
  // 애플리케이션 서버의 타임존을 고려하여 Date타입을 재가공 (ex. 2021-08-01T00:00:00.000Z -> 2021-08-01 00:00:00)
  static formatDate(date: Date): string {
    const localDateTime: Date = new Date(
      date.getTime() - date.getTimezoneOffset() * 60 * 1000
    );

    return localDateTime.toISOString().substring(0, 19).replace('T', ' ');
  }
}
