import React from 'react';
import IAward from '../model/award.model';

const Awards: React.FC<{awards: Array<IAward>}> = ({awards}) => {

    return (
        <section className="education-section py-3">
            <h3 className="text-uppercase resume-section-heading mb-4">Awards</h3>
            <ul className="unstyled resume-awards-list">
                {
                    awards.map((award, idx) => {
                        return (
                            <li key={idx} className="mb-3">
                                <div className="font-weight-bold">{award.name}</div>
                                <div className="text-muted">{`${award.organization} (${award.time})`}</div>
                            </li>
                        );
                    })
                }
            </ul>
        </section>
    );

}

export default Awards;