import Topbar from './Topbar';

export default function Navbar({ onMenuClick, title }) {
  return <Topbar onMenuClick={onMenuClick} title={title} />;
}
