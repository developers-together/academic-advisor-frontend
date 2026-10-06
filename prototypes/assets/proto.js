/* Advisor prototype suite — tiny helpers (throwaway). */

// State switcher: [data-proto-tabs] buttons target [data-pane] siblings.
document.querySelectorAll('[data-proto-tabs]').forEach((group) => {
  const scope = document.querySelector(group.dataset.protoTabs || 'body');
  group.querySelectorAll('button[data-pane]').forEach((btn) => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      scope.querySelectorAll('[data-pane]').forEach((pane) => {
        pane.classList.toggle('active', pane.dataset.pane === btn.dataset.pane);
      });
    });
  });
});

// Popover toggles: button[data-pop] toggles the element with that id.
document.querySelectorAll('[data-pop]').forEach((btn) => {
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const target = document.getElementById(btn.dataset.pop);
    if (target) target.style.display = target.style.display === 'block' ? 'none' : 'block';
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.popover[data-openable]').forEach((p) => (p.style.display = 'none'));
});

// Dirty-guard demo: any input inside [data-dirty] raises the bar text.
document.querySelectorAll('[data-dirty]').forEach((form) => {
  form.addEventListener('input', () => {
    const bar = document.getElementById(form.dataset.dirty);
    if (bar) bar.style.display = 'flex';
  });
});
