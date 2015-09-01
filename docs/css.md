# Pay-frontend CSS Styleguide

To be read in conjunction with the GOV.UK CSS Styleguide

## File structure and scope

Tech-debt creep in CSS is usually an symptom of a lack of confidence in changing or removing existing CSS. By structuring CSS in the following way, we can help reduce this risk by clearly communicating the scope of any given CSS.

They are structured to take advantage of the [conditionals][1] from the frontend_toolkit. This means you should put your IE fixes inline not in a separate file.

Within the frontend folder the basic structure of the files looks like:

/sass/applications.scss
/sass/forms/
/sass/helpers/
/sass/reset/
/sass/styleguide/

### `/sass/forms/`
Forms are where all the styles for forms and form elements live. The only form related styles that don;t live here are styles for buttons. Which can be found in the styleguide.

### `/sass/helpers/`
Helpers are blocks of reuseable widely-scoped sass which cannot be said to be coupled to any particular partial or template. They may be more general-purpose styles, for example the style of an out-going link.
When introducing a new helper, take care to consider exactly what it is for, how it's going to be used and if it's needed at all. Helpers can be extremely difficult to manage from a legacy point of view as they can introduce coupling between markup elements creating a kind of CSS soup where it's impossible to change anything without something else changing without there being regressions.

### `/sass/reset/`
This contains the base html resets which remove most of the default styling a browser adds to elements.

### `/sass/styleguide/`
Styleguide is mainly a collection of Sass mixins. This folder also contains _layout.scss which houses page wrapper styles and grid styles too.
