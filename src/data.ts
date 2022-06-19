import IResumeData from './model/resume-data.model';

export const RESUME_DATA: Readonly<IResumeData> = {
    personalInfomation: {
        email: 'ngducanhkhoiii@gmail.com',
        fullName: 'Nguyen Duc Anh Khoi',
        jobTitle: 'Developer',
        phoneNumber: "+84 xxx xxx xxx",
        website: 'https://ndanhkhoi.github.io',
        address: 'Can Tho, Viet Nam'
    },
    sumary: `I want to become a highly skilled developer and find a job in a professional environment to take advantage of the experience that I have accumulated over the years creating quality websites or applications`,
    workExperiences: [
        {
            time: 'Mar 2020 - now',
            company: 'VNPT IT',
            jobPosition: 'Developer/ Software engineer',
            description: [
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
            time: 2021,
            name: 'Simple Telegram Command Bot Spring Boot Starter',
            technology: 'Java, Spring Boot, Reactor',
            description: 'A simple-to-use library to create Telegram Long Polling Bots in Java and Spring Boot with syntax like Spring MVC',
            type: 'Open source',
            github: 'https://github.com/ndanhkhoi/simple-telegram-command-bot-spring-boot-starter'
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
            'Java/ Spring/ Hibernate/ Jhipster',
            'HTML/CSS/Bootstrap',
            'JavaScript/ ReactJS',
            'C#/ ASP.NET (basic)',
            'MySQL/ MSSQL/ Oracle/ PostgreSQL/ MongoDB',
            'Kafka/ RabbitMQ',
            'Reactor programing',
            'Object-oriented design',
            'Microservice architecture',
            'Implement data structures and algorithm',
            'Design and implement database structures'
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
            name: 'Listed on the honors table of Collection and School for best students',
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
            name: 'VNPT Star Award',
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
