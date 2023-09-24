/* global window, document */

/**
 * Manage logo display
 * If logos list fits on viewport width its static, if not logos will rotate automatically
 * @params {*} none
 * @return {function} initializes a logo display
 */
 const lists = (function() {
  const init = () => {
    if (document.querySelector(".js-logos")) {
      logoLists();
    }
  };

  const logoLists = () => {
    const allLogosLists = document.querySelectorAll(".js-logos");
    let viewportWidth = window.innerWidth;
    allLogosLists.forEach(logosList => {
      if (logosList.offsetWidth > viewportWidth) {
        logosList.parentElement.classList.remove("no-animation");
      } else {
        logosList.parentElement.classList.add("no-animation");
      }
    });

    // add a resize observer to check if logos list fits on viewport width
    const resizeObserver = new ResizeObserver(entries => {
      viewportWidth = window.innerWidth;

      allLogosLists.forEach(logosList => {
        if (logosList.offsetWidth > viewportWidth) {
          logosList.parentElement.classList.remove("no-animation");
        } else {
          logosList.parentElement.classList.add("no-animation");
        }
      });
    });

    // observe all logos lists
    allLogosLists.forEach(logosList => {
      resizeObserver.observe(document.body);
    });  
  }


  return { init };
})();

export default lists;
