import React from 'react';
import IEducation from "../model/education.model";

const Education: React.FC<{educations: Array<IEducation>}> = ({educations}) => {

    return (
        <section className="education-section py-3">
            <h3 className="text-uppercase resume-section-heading mb-4">Education</h3>
            <ul className="unstyled resume-education-list">
                {
                    educations.map((education, idx) => {
                        return (
                            <li key={idx} className="mb-3">
                                <div className="resume-degree font-weight-bold">
                                    {education.mojor} ({education.degree})
                                </div>
                                <div className="resume-degree-org text-muted">
                                    GPA: {education.gpa}
                                </div>
                                <div className="resume-degree-org text-muted">
                                    {education.school}
                                </div>
                                <div className="resume-degree-time text-muted">
                                    {education.year}
                                </div>
                            </li>
                        );
                    })
                }
            </ul>
        </section>
    );

}

export default Education;