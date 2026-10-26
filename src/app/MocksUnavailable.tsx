export function MocksUnavailable() {
  return (
    <main className="page">
      <section className="card" role="alert">
        <h1 className="page__title">Не удалось запустить демо</h1>
        <p>
          Демо работает без бэкенда: запросы к API обрабатывает Service Worker в браузере. Этот
          браузер не разрешил его запустить — так бывает в приватном режиме или при отключённом
          сохранении данных сайтов.
        </p>
        <p>Откройте страницу в обычном окне браузера.</p>
      </section>
    </main>
  );
}
