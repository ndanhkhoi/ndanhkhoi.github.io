import IResumeData from './model/resume-data.model';

export const RESUME_DATA: Readonly<IResumeData> = {
    personalInfomation: {
        email: 'khoinda.611@gmail.com',
        fullName: 'Nguyen Duc Anh Khoi',
        jobTitle: 'Developer',
        phoneNumber: "+84 776 524 327",
        website: 'https://ndanhkhoi-blog.pages.dev',
        facebook: 'https://facebook.com/ndanhkhoi',
        address: 'Can Tho, Viet Nam'
    },
    sumary: `You are looking for a skilled programmer in website development? I could be one you're seeking! I graduated with Information Technology excellent certifite from Can Tho University in 2019 and GPA was 3.8/4.0. This school is ranked third in Vietnam by Webometrics ranking 2019. With 4 years experience in developing website with Java Spring and React JS, I can develop quality websites with friendly UI and good perfomance.`,
    workExperiences: [
        {
            time: 'Mar 2020 - Present',
            company: 'VNPT IT',
            jobPosition: 'Developer/ Software engineer',
            description: [
                `Team Lead of 'Fee & Health Insurance' module of VNPT HIS Hospitals Infomation System (HIS)`,
                `Integrating cashless payment via QR Code of VietinBank, Agribank, VNPT Money for Hospitals Infomation System (HIS)`,
                `Integrating VNPT Invoice electronic invoices for Hospitals Infomation System (HIS)`,
                `Build the function of connecting medical examination data with the health insurance assessment portal`,
                `Maintain, and develop new feature for 'Fee & Health Insurance' module of VNPT HIS`,
                `Analysis, design and develop a 'Fee & Health Insurance' microservice for VNPT Home & Clinic - The clinic manager and family doctor system`,
                `Design and develop front-end for VNPT Home & Clinic`,
                `Develop front-end and back-end for Covid disease management system for Tien Giang Province`
            ],
            technology: ['Java, Spring boot, Hibernate, Jhipster, Liquibase', 'Jasper report', 'React JS', 'PostgreSQL, Oracle, MongoDB']
        },
        {
            time: 'Sep 2019 - Feb 2020',
            company: 'VNPT IT',
            jobPosition: 'Fresher',
            description: [
                `Maintain, and develop new feature for 'Fee & Health Insurance' module of VNPT HIS.`
            ],
            technology: ['Java, Spring MVC, JSP', 'Jasper report', 'Oracle PL/SQL']
        },
        {
            time: 'May 2019 - July 2019',
            company: 'VNPT IT',
            jobPosition: 'Internship',
            description: [
                `Analysis, design and develop "Receive patients by electronic card". It is a module of VNPT HIS - the hospital infomation system`,
                `Attend Microservice workshops in company`
            ],
            technology: ['Java/ Spring MVC/ Apache Free Maker', 'React JS', 'Oracle']
        }
    ],
    projects: [
        {
            time: 'August 2023 - Present',
            name: `Ndanhkhoi's blog`,
            technology: 'ReactJS, Docusaurus',
            description: 'Personal blog to post my articles',
            type: 'Personal Projects',
            link: 'https://ndanhkhoi.name.vn/'
        },
        {
            time: 'January 2023 - Present',
            name: 'Moni',
            technology: 'Java, Spring Boot, ReactJS, TailwindCSS, PostgreSQL',
            description: 'Personal enpense manager system - Track expenses and achieve your personal financial goals',
            type: 'Personal Projects',
            link: 'https://moni.ndanhkhoi.name.vn/'
        },
        {
            time: 'February 2023 - May 2023',
            name: 'Inventory',
            technology: 'Java, Spring Boot, JMIX, TailwindCSS, PostgreSQL',
            description: 'Inventory management system for stores with import, invoicing, export, and revenue reporting features',
            type: 'Projects for customer',
        },
        {
            time: 'August 2023 - Present',
            name: 'Google Bard Client Library For Java',
            technology: 'Java',
            description: 'Simple client to get Google Bard\'s answer from your prompt',
            type: 'Open source',
            github: 'https://github.com/ndanhkhoi/GoogleBardClient'
        },
        {
            time: 'December 2022',
            name: 'Zero Stickers',
            technology: 'Java, Spring Boot, ReactJS, MongoDB',
            description: 'Web application can help you to make sticker packs form Telegram.',
            type: 'Personal Projects',
            link: 'https://zero-sticker.onrender.com/'
        },
        {
            time: 'April 2021 - Present',
            name: 'Simple Telegram Command Bot Spring Boot Starter',
            technology: 'Java, Spring Boot, Reactor',
            description: 'A simple-to-use library to create Telegram Long Polling Bots in Java and Spring Boot with syntax like Spring MVC',
            type: 'Open source',
            github: 'https://github.com/ndanhkhoi/simple-telegram-command-bot-spring-boot-starter'
        },
        {
            time: 'April 2020 - July 2022 ',
            name: 'VNPT Home & Clinic',
            technology: 'Oracle Database · Jasper Reports · Apache Kafka · RabbitMQ · Microservices · JHipster · Bootstrap (Framework) · Java · Spring Boot · React.js',
            description: 'VNPT Home & Clinic is comprehensive support software for general clinics and private specialized clinics in managing reception, treatment, pharmacy, hospitals and revenue safely, helping to save time. time and manpower. \n' +
                'Silver award in the product and service category dedicated to healthcare at IT World Awards 2022',
            type: 'Company Projects - Associated with VNPT IT',
        },
        {
            time: 2019,
            name: 'Hospital schedule management system',
            technology: 'Java, Spring Boot, Hibernate, Jasper report, React JS, Oracle, Genetic Algorithm',
            description: 'A modern website to management work schedule of doctor and nurse in a hospital. It allows doctors and nurses to register their leave or meeting days to avoid being scheduled on those days. In addition, the system can also arrange its own schedule quickly and fairly by genetic algorithm',
            type: 'Graduation essay',
        },
        {
            time: 2019,
            name: 'Mobile Phone Store Management System',
            technology: 'Java, JSP, Spring MVC, Spring Security, Hibernate, MySQL',
            description: 'Website for mobile phone store, customer can be search their favorite phone and order it via this website. Store owners can manage products, employees as well as store order bill easily.',
            type: 'Course projects'
        },
        {
            time: 2019,
            name: 'Helpdesk System',
            technology: 'C# winform, ASP .NET, MS SQL Server',
            description: 'A helpdesk system for a company, user can report for a problem and technicians can help them in this system',
            type: 'Course projects'
        },
        {
            time: 2018,
            name: 'River Crossing Pizzle and Maze Pizzle',
            technology: 'Java Swing, AI with A* and Greedy algorithm',
            description: `Both of them are simple puzzle desktop game. In River Crossing Pizzle, the player needs to get the people on one side of the river to the other in the allotted time. If the time limit is exceeded, the game will be over. The answer of the game can be automatically found by the greedy algorithm. In the maze puzzle, the player needs to find the way out of the maze, the answer to the game can be found using the A* algorithm.`,
            type: 'Course projects'
        },
        {
            time: 2017,
            name: 'Library Manager software',
            technology: 'Java Swing, JDBC, MySQL',
            description: `This is a simple desktop application for managing books in a school's library`,
            type: 'Course projects'
        }
    ],
    skill: {
        technical: [
            'Java/ Spring/ Hibernate/ Jhipster/ JMIX',
            'HTML/CSS/Bootstrap/TailwindCSS',
            'JavaScript/ Typescript/ ReactJS',
            'Flutter/ C#/ ASP.NET, .NET core (basic)',
            'MySQL/ MSSQL/ Oracle/ PostgreSQL/ MongoDB',
            'Kafka/ RabbitMQ',
            'Docker/ Docker compose/ Portainer',
            'CI/CD with GitHub Action, Gitlab CI, Heroku, Render, Vercel, Northflank',
            'Reactor programing',
            'Object-oriented design',
            'Microservice architecture',
            'Jira / Work with scrum agile',
            'Implement data structures and algorithm',
            'Design and implement database structures',
        ],
        professional: ['Effective communication', 'Team player', 'Presentation', 'Strong problem solver']
    },
    educations: [
        {
            school: 'Can Tho University',
            mojor: 'Infomation Technology',
            gpa: '3.8/4',
            year: '2015-2019',
            degree: 'Engineer'
        }
    ],
    awards: [
        {
            name: 'Scholarship for Top 5 Student in Class',
            organization: 'Can Tho University',
            time: '2016, 2017, 2018, 2019'
        },
        {
            name: 'Listed on the honors table of Colleges and School for best students',
            organization: 'Can Tho University',
            time: '2016, 2017, 2018'
        },
        {
            name: 'VNPT IT Scholarship for talent students',
            organization: 'VNPT IT',
            time: '2019'
        },
        {
            name: 'Top 10 student with excellent graduated',
            organization: 'Can Tho University',
            time: '2019'
        },
        {
            name: 'VNPT Star Award for good employees with many contributions to the company',
            organization: 'VNPT IT',
            time: '2020'
        },
    ],
    languages: [
        {name: 'Vietnamese', level: 'native'},
        {name: 'English', level: 'basic'}
    ],
    interests: ['Reading', 'Football', 'Music'],
    github: 'https://github.com/ndanhkhoi/ndanhkhoi.github.io'
}
