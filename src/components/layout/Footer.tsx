import type { Dictionary } from "@/i18n/get-dictionary";

export default function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="bg-navy-900 text-white py-10">
      <div className="max-w-content mx-auto px-container">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-electric-500 flex items-center justify-center">
                <span className="text-white font-heading font-bold text-lg">F</span>
              </div>
              <span className="font-heading font-bold text-lg">
                FIF {dict.meta.siteName}
              </span>
            </div>
            <p className="text-navy-200 text-body-sm max-w-xs">
              {dict.footer.projectBy}{" "}
              <a
                href="https://www.ffrail.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-electric-400 hover:text-electric-300 underline"
              >
                {dict.footer.fif}
              </a>
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold text-body-sm mb-3 text-electric-400">
              {dict.footer.usefulLinks}
            </h4>
            <ul className="space-y-2 text-body-sm text-navy-200">
              <li>
                <a
                  href="https://www.futurentrain.fr/formations/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Futur en Train
                </a>
              </li>
              <li>
                <a
                  href="https://www.onisep.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  ONISEP
                </a>
              </li>
              <li>
                <a
                  href="https://www.campusfrance.org/fr/etablissements-enseignement-superieur-France"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Campus France
                </a>
              </li>
              <li>
                <a
                  href="https://www.ffrail.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  FIF - ffrail.fr
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-navy-700 text-center text-caption text-navy-400">
          &copy; {new Date().getFullYear()} FIF - {dict.footer.fif}. {dict.footer.rights}.
        </div>
      </div>
    </footer>
  );
}
