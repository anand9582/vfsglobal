import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import ModalComponent from './ModalComponent';
import LoginForm from './LoginForm'

function Header() {
  // State to manage menu visibility
  const [isMenuOpen, setMenuOpen] = useState(false);

  // Handler to toggle menu
  const handleMenuToggle = () => {
       setMenuOpen(!isMenuOpen);
        if (!isMenuOpen) {
          document.body.classList.add('open-header');
        } else {
          document.body.classList.remove('open-header');
        }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [isSticky, setSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setSticky(true);
      } else {
        setSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`header ${isSticky ? 'fixed-header' : ''}`} id="header">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <nav className="navbar navbar-expand-lg py-3 px-0 justify-content-between">
              <div className="nav-logo">
                <Link to="#" className="logo">
                  <img src={`${process.env.PUBLIC_URL}/images/logo.png`} alt="Logo" />
                </Link>
              </div>
              <div className="header-right">
                <div className={`menu-box ${isMenuOpen ? 'active' : ''}`}>
                  <nav className="nav-inner">
                    <ul className="main-menu js-menu" id="mainMenu">
                      <li>
                        <ScrollLink
                          className="nav-item"
                          to="home"
                          activeClass="current"
                          spy={true}
                          smooth={true}
                          duration={500}
                        >
                          Home
                        </ScrollLink>
                      </li>
                      <li>
                        <ScrollLink
                          className="nav-item"
                          to="features"
                          activeClass="current"
                          spy={true}
                          smooth={true}
                          duration={500}
                        >
                          Features
                        </ScrollLink>
                      </li>
                      <li>
                        <ScrollLink
                          className="nav-item"
                          to="services"
                          activeClass="current"
                          spy={true}
                          smooth={true}
                          duration={500}
                        >
                          Services
                        </ScrollLink>
                      </li>
                      <li>
                        <ScrollLink
                          className="nav-item"
                          to="contact"
                          activeClass="current"
                          spy={true}
                          smooth={true}
                          duration={500}
                        >
                          Contact
                        </ScrollLink>
                      </li>
                      <li>
                        <ScrollLink
                          className="nav-item"
                          to="testimonials"
                          activeClass="current"
                          spy={true}
                          smooth={true}
                          duration={500}
                        >
                          Testimonials
                        </ScrollLink>
                      </li>
                      <li>
                        <ScrollLink
                          className="nav-item"
                          to="blog"
                          activeClass="current"
                          spy={true}
                          smooth={true}
                          duration={500}
                        >
                          Blog
                        </ScrollLink>
                      </li>
                    </ul>
                  </nav>
                </div>
                <Link className="btn-2 btn_started-header js-fancybox" onClick={openModal}>
                  Login
                </Link>
              </div>

              <div  className={`bars-mob js-button-nav ${isMenuOpen ? 'active' : ''}`} onClick={handleMenuToggle}>
                <div className="hamburger">
                  <span></span><span></span><span></span>
                </div>
                <div className="cross">
                  <span></span><span></span>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
      <ModalComponent
        isOpen={isModalOpen}
        onClose={closeModal}
        content={
          <div className="modal-body p-0">
            <LoginForm/>
          </div>
        } // Replace with your actual login form
      />
    </header>
  );
}

export default Header;
