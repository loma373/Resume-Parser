var request = require("request");
var cheerio = require("cheerio");
var _ = require('underscore');

module.exports = {
  titles: {
    objective: ['objective', 'objectives'],
    summary: ['summary'],
    experience: ['experience', 'work'],
    education: ['education', 'enlightenment', 'indoctrination'], 
    skills: ['skills', 'Skills & Expertise', 'Technology', 'Technologies', 'Concepts'],
    languages: ['languages', 'linguals', 'ligustics'],
    courses: ['courses', 'courses completed'],
    projects: ['projects', 'personal projects'],
    links: ['links'],
    positions: ['position', 'roles', 'position of responsibility'],
    profiles: ['profiles', 'socials'],
    awards: ['awards', 'recognitions'],
    honors: ['honors'],
    certification: ['certification', 'certifications', 'certificates'],
    interests: ['interests', 'areas of interest'],
    dob: ['DOB','Date of Birth', 'Birthday'],
    address: ['Address', 'Residence', 'Permanent Address']
  },
  profiles: [
    ['linkedin.com', function(url, Resume, profilesWatcher) {
      download(url, function(data, err) {
        console.log(url)
        console.log(data)
        if (data) {
          var $ = cheerio.load(data),
            linkedData = {
              positions: {
                past: [],
                current: {}
              },
              languages: [],
              skills: [],
              educations: [],
              volunteering: [],
              volunteeringOpportunities: []
            },
            $pastPositions = $('.past-position'),
            $currentPosition = $('.current-position'),
            $languages = $('#languages-view .section-item > h4 > span'),
            $skills = $('.skills-section .skill-pill .endorse-item-name-text'),
            $educations = $('.education'),
            $volunteeringListing = $('ul.volunteering-listing > li'),
            $volunteeringOpportunities = $('ul.volunteering-opportunities > li');

          linkedData.summary = $('#summary-item .summary').text();
          linkedData.name = $('.full-name').text();
          // current position
          linkedData.positions.current = {
            title: $currentPosition.find('header > h4').text(),
            company: $currentPosition.find('header > h5').text(),
            description: $currentPosition.find('p.description').text(),
            period: $currentPosition.find('.experience-date-locale').text()
          };
          // past positions
          _.forEach($pastPositions, function(pastPosition) {
            var $pastPosition = $(pastPosition);
            linkedData.positions.past.push({
              title: $pastPosition.find('header > h4').text(),
              company: $pastPosition.find('header > h5').text(),
              description: $pastPosition.find('p.description').text(),
              period: $pastPosition.find('.experience-date-locale').text()
            });
          });
          Resume.addObject('linkedin', linkedData);
        } else {
          console.log("data not loaded");
        }
        profilesWatcher.inProgress--;
      });
    }],
  ],
  inline: {
    skype: 'skype'
  },
  regular: {
    name: [
      /([A-Z][a-z]*)(\s[A-Z][a-z]*)/
    ],
    phone: [
      /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,5}$/
    ],
    email: [
      /([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})/
    ]
    // company: [
    //   /(?<=\n)([A-Za-z]+\.?\s?[A-Za-z]+)(?=(,|\n-))/
    // ]
  }
};

// helper method
function download(url, callback) {
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(body);
    } else {
      callback(null, error)
    }
  });
}