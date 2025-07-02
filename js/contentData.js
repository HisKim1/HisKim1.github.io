window.contentData = {
  pages: {
    home: `
<section class="home-section">
  <div class="home-wrapper">
  <div class="home-content">
    <div class="profile-circle">
      <img src="images/profile.jpg" alt="Hisu Kim" class="profile-pic">
    </div>
    <h1 class="big-name">Hisu Kim</h1>
    <h2 class="sub-title">Forecasts the Future Forecasting</h2>

    <div class="info-box">
      <h3 class="info-title">🎓 Academic Journey</h3>
      <p>
        I'm expected to graduate with a bachelor's degree this summer and will begin my master's studies at the Climate Analysis Modeling Lab under the supervision of Prof. Jinho Yoon at GIST.
      </p>
      <p>
        My majors are Computer Science and Environmental Engineering with a minor in Mathematics.
      </p>
    </div>

    <div class="info-box">
      <h3 class="info-title">🔬 Research Passion</h3>
      <p>
        I'm interested in understanding the physics behind deep learning weather and climate models, and in making them more trustworthy. Currently, I'm exploring how the butterfly effect shows up in these models and what it means from a spectral perspective.
      </p>
    </div>
  </div>
  </div>
</section>`,
    education: `
<section class="education-section">
  <h2>Education</h2>
    <p class="intro">
      Want to be interdisciplinary-<br>
      <span style="display: block; height: 0.3em;"></span>
      to think like a <i>mathematician</i>, <br>
      code like a <i>computer scientist</i>,<br>
      and model the world like a <i>meteorologist</i>.<br>
  </p>
  <ul class="education-list">
    <li>
      <div class="education-item">
        <div class="edu-top">
          <span class="edu-school">Gwangju Institute of Science and Technology (GIST), South Korea</span>
          <span class="edu-period">2019 – 2025 Spring (expected)</span>
        </div>
        <div class="edu-bottom">
          <span class="edu-detail">
            B.E. in Electrical Engineering and Computer Science<br>
            & Earth Science and Environmental Engineering<br>
            Minor in Mathematics<br>
            <span style="display: inline-block; margin-top: 4px;">
              Thesis: <i>Butterfly Effect in Deep Learning: Error Cascade Dynamics in Graph Neural Network Weather Forecasts</i>
            </span>

          </span>
          <span class="edu-tgpa">TGPA 4.09/4.5</span>
        </div>
      </div>
    </li>

    <li>
      <div class="education-item">
        <div class="edu-top">
          <span class="edu-school">Warsaw University of Technology (WUT), Poland</span>
          <span class="edu-period">2023 Fall</span>
        </div>
        <div class="edu-bottom">
          <span class="edu-detail">
            Exchange Student, Faculty of Building Services, Hydro and Environmental Engineering<br>
            Took 25 ECTS
          </span>
          <span class="edu-tgpa">TGPA 4.86/5.0</span>
        </div>
      </div>
    </li>

    <li>
      <div class="education-item">
        <div class="edu-top">
          <span class="edu-school">University of California, Berkeley, USA</span>
          <span class="edu-period">2023 Summer</span>
        </div>
        <div class="edu-bottom">
          <span class="edu-detail">
            Summer Session C<br>
            Courses: CS70, CS188
          </span>
          <span class="edu-tgpa">TGPA 4.0/4.0</span>
        </div>
      </div>
    </li>
  </ul>
</section>`,
    research: `
<section class="publication-section">
  <h2>Publications</h2>
  <ul class="publication-list">
    <li>
  J. Ryu, <strong><u>H. Kim</u></strong>, S. Wang, J. Yoon.
  Increasing Resolution and Accuracy in Sub-Seasonal Forecasting through 3D U-Net: the Western US
  <a href="https://egusphere.copernicus.org/preprints/2025/egusphere-2025-308/"target="_blank" rel="noopener noreferrer">
    [Preprint]
  </a>
  <span class="status"> (Under Review at Geoscientific Model Development)</span>
</li>
    <li>
      Will be updated soon...!
    </li>
  </ul>

  <h2>Experience</h2>

  <ul class="education-list">

    <li>
      <div class="education-item">
        <div class="edu-top">
          <span class="edu-school">Climate Analysis and Modeling Lab, GIST</span>
          <span class="edu-period">2023 Feb – Present</span>
        </div>
        <div class="edu-bottom">
          <span class="edu-detail">
            Undergraduate Research Intern under Prof. Jin-ho Yoon<br>

            <span style="display: block; height: 0.3em;"></span>
            • Explored perturbations in GraphCast to examine error cascades and the butterfly effect.<br>
            • Investigated the potential use of physics-aligned perturbations to enhance deep learning-based weather forecasting.<br>
            • Analyzed the relationship between SO₂, NOₓ pollution and Yongsan River water quality using ECMWF data.
          </span>
        </div>
      </div>
    </li>
  </ul>
</section>`,
    teaching: `
<section class="teaching-section">
  <h2>Teaching</h2>

  <p class="intro">
    I learn best by teaching—it's how I digest and refine what I know.<br>
    (Even though it sometimes reveals just how much I still have to learn 😅)
  </p>
  <div id="teaching-cards"></div>
</section>`,
    projects: `
<section class="projects-section">
  <h2>Projects</h2>
  <div id="project-cards"></div>
</section>`,
    contact: `
<section class="contact-section">
  <h2>Contact</h2>
  <div class="contact-links">
    <p><strong>Email:</strong> <a href="mailto:tomm1203@gist.ac.kr">tomm1203@gist.ac.kr</a></p>
    <p><strong>LinkedIn:</strong> <a href="https://linkedin.com/in/hisu-kim" target="_blank">linkedin.com/in/hisu-kim</a></p>
    <p><strong>GitHub:</strong> <a href="https://github.com/HisKim1" target="_blank">github.com/HisKim1</a></p>
  </div>

<div class="card fun-fact-card">
  <div class="card-header">
    <h5>▼ Wanna know more about me? ▼</h5>
  </div>
  <div class="card-content">
    <p>
      Fun fact! I’ve been dancing to hip-hop throughout college as part of a campus dance crew,
      and throwing barbells in CrossFit for three years now.

      <span style="display: block; height: 0.3em;"></span>
      Safe to say—I love movement, whether it’s rhythm or reps!
    </p>
  </div>
</div>

</section>`
  },
  projects: [
    {
      images: "images/AIweatherquest.png",
      title: "AI Weather Quest 2025",
      description: `
        Hosted by European Centre ofr Medium-Range Weather Forecasts (ECMWF)
        <ul>
          <li>
            Currently preparing for the AI Weather Quest 2025 competition with my lab members
          </li>
          <li>
            Aims to develop a DL/ML model to predict Seasonal to Subseasonal (S2S) weather forecasts
          </li>
        </ul>
      `
    },
    {
      images: "images/pacman.jpeg",
      title: "The Pac-Man Project",
      description: `from UC Berkeley CS188: <i>Intro. to AI</i>
        <ul>
          <li>Programmed the Pac-Man artificial intelligence using simple search algorithms (DFS, BFS, A* search, search tree),
 based on Bayes Net and using reinforcement learning</li>
          <li>Built neural networks and examined parameter values to classify MNIST dataset and words from different
 languages</li>
        </ul>
      `
    },
    {
      images: "images/PACA.jpg",
      title: "PACA: Python Autograder for Coding Assignment",
      description: `from GIST EC4206: <i>Computer Networking</i>
        <ul>
          <li>Developed a web server with Flask framework to communicate with the back-end server using socket programming</li>
          <li>Modified a web design sample to apply our project and connected it to the web server</li>
          <li>Designed presentation slides and introduced the product with a code review</li>
        </ul>

      `
    },
    {
      images: "images/treatment system cut.png",
      title: "Environmental Impact Assessment of Potential Wastewater Treatment System in Putignano, Italy",
      description: `
      from WUT: <i>Environmental Impact Assessments</i>
          <li>
            Analyzed regional climate patterns near the target area using ERA5 reanalysis data and applied Leopold matrices to evaluate impacts during construction, operation, and liquidation phases
          </li>
          <li>
            Designed a biological wastewater treatment system, compared its environmental performance against chemical and electrochemical alternatives, and proposed mitigation strategies
          </li>
      `
    },
    {
      images: "images/Bratislava.jpg",
      title: "🚧Under Construction🚧",
      description: `
      Several more projects have been completed but haven’t made it to this page yet. This page is still catching up!
      `
    }
  ],
  teaching: [
    {
      title: "Mathematics",
      description: `
        <h4>Multivariable Calculus (2025 Spring)</h4>
        <h4>Graph Theory (2024 Fall)</h4>
      `
    },
    {
      title: "Computer Science",
      description: `
        <h4>Digital Design (2023 Spring)</h4>
      `
    },
    {
      title: "Literature",
      description: `
        <h4>Prof. Soo-Jeong Lee's Literature Courses (2023 Spring – Present)</h4>
        <p><i>Reading Contemporary Poetry</i>, <i>Korean Poets</i>, <i>Understanding Poetry</i>, <br>
           <i>Ri Sangs Literature and Science</i>, and <i>Writing I: Creative Writing</i></p>
      `
    },
    {
      title: "Mentoring",
      description: `
        <h4>GIST 101 (2023, 2024 Spring)</h4>
      `
    }
  ]
};
